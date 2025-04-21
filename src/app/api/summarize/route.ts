/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { db } from '@/src/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';
import http from 'http';

// Force this route to be dynamic and bypass caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  console.log('Received summarize request');
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      console.error('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User authenticated successfully');

    // Check if user has configured OpenAI API key
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        openaiApiKey: true,
        stripePriceId: true,
        planName: true,
        usedQuota: true
      }
    });

    // Check if user has purchased a plan
    if (!dbUser?.stripePriceId) {
      return NextResponse.json(
        { error: 'You need to purchase a plan to access this feature. Please visit the billing page to upgrade.' },
        { status: 403 }
      );
    }

    if (!dbUser?.openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your API key in the dashboard settings.' },
        { status: 400 }
      );
    }

    // Initialize OpenAI with user's API key
    let openai: OpenAI;
    try {
      openai = new OpenAI({
        apiKey: dbUser.openaiApiKey || '',
      });
    } catch (apiError) {
      console.error('Error initializing OpenAI client:', apiError);
      return NextResponse.json(
        { error: 'Invalid OpenAI API key configuration.' },
        { status: 400 }
      );
    }

    // Validate request data
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { url, quickMode } = requestData;
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing YouTube URL' },
        { status: 400 }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get transcript
    let transcript: string;
    try {
      transcript = await getTranscript(videoId);
    } catch (transcriptError: any) {
      return NextResponse.json(
        { error: transcriptError.message },
        { status: 400 }
      );
    }

    const tier = dbUser.planName || 
      (dbUser.planName ? 
        (dbUser.planName.includes('Pro') ? 'Pro' : 'Basic') 
        : 'Basic');

    // Check total quota limits based on tier
    // Pro is unlimited, Basic has 100 summaries
    const totalQuota = tier === 'Pro' ? Infinity : 100;
    
    if (dbUser.usedQuota >= totalQuota && totalQuota !== Infinity) {
      return NextResponse.json(
        { error: 'You have reached your total summary quota. Please upgrade your plan to continue.' },
        { status: 403 }
      );
    }

    // Check rate limits (prevent abuse)
    const userRequests = await db.apiRequest.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000)
        }
      }
    });

    const rateLimit = tier === 'Pro' ? 60 : 10;
    if (userRequests > rateLimit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const content = await generateSummary(transcript, tier, openai, quickMode);

    // Increment the used quota counter and create the summary
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { usedQuota: { increment: 1 } }
      }),
      db.summary.create({
        data: {
          title: content.split('\n')[0],
          content: content,
          userId: user.id,
        },
      }),
      db.apiRequest.create({
        data: {
          userId: user.id
        }
      })
    ]);

    // Return the summary data
    const summary = {
      id: Date.now().toString(), // Generate a temporary ID
      content: content,
    };

    return NextResponse.json({ summary, transcript });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
}

function extractVideoId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function getTranscript(videoId: string): Promise<string> {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.SMARTPROXY_USERNAME && process.env.SMARTPROXY_PASSWORD) {
      console.log('Using SmartProxy for YouTube transcript fetch');
      
      // Create proxy URL - using US endpoint and HTTPS as recommended by SmartProxy
      const username = process.env.SMARTPROXY_USERNAME;
      const password = process.env.SMARTPROXY_PASSWORD;
      const proxyUrl = `https://${username}:${password}@us.smartproxy.com:10000`;
      
      // Create the proxy agent
      const proxyAgent = new HttpsProxyAgent(proxyUrl);
      
      try {
        // Save original global agents
        const originalHttpsAgent = https.globalAgent;
        const originalHttpAgent = http.globalAgent;
        
        // Set global agents to our proxy
        https.globalAgent = proxyAgent as any;
        http.globalAgent = proxyAgent as any;
        
        try {
          // Test the proxy connection
          console.log('Testing proxy connection...');
          const testResponse = await fetch('https://ip.smartproxy.com/json', {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (!testResponse.ok) {
            throw new Error(`Proxy test failed with status: ${testResponse.status}`);
          }
          
          const proxyInfo = await testResponse.json();
          console.log('SmartProxy connection successful. IP:', proxyInfo.ip);
          
          // First, try using the YouTubeTranscript library
          try {
            console.log('Fetching transcript with global proxy agent...');
            const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
            
            if (!transcriptArray || transcriptArray.length === 0) {
              throw new Error('No transcript available for this video.');
            }
            
            const transcript = transcriptArray
              .map((item: { text: string }) => item.text)
              .join(' ');
              
            return transcript;
          } catch (transcriptError) {
            console.error('Standard transcript fetch failed, trying direct YouTube API access...', transcriptError);
            
            // If the library fails, try a direct approach using fetch + proxy
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            // Fetch the video page to get necessary cookies and tokens
            const videoPageResponse = await fetch(videoUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
              },
              signal: AbortSignal.timeout(15000)
            });
            
            if (!videoPageResponse.ok) {
              throw new Error(`Failed to fetch video page: ${videoPageResponse.status}`);
            }
            
            // Try to find the caption tracks in the YouTube page response
            const html = await videoPageResponse.text();
            const captionTracksMatch = html.match(/"captionTracks":\s*(\[.*?\])(?=,)/);
            
            if (captionTracksMatch && captionTracksMatch[1]) {
              try {
                const captionTracks = JSON.parse(captionTracksMatch[1]);
                
                if (captionTracks && captionTracks.length) {
                  // Get the first English track or just the first track
                  const track = captionTracks.find((t: any) => 
                    t.languageCode && (t.languageCode.includes('en') || t.name.simpleText.includes('English'))
                  ) || captionTracks[0];
                  
                  if (track && track.baseUrl) {
                    console.log(`Found caption track: ${track.name?.simpleText || 'Unnamed'}`);
                    
                    // Fetch the actual transcript data
                    const captionResponse = await fetch(track.baseUrl, {
                      signal: AbortSignal.timeout(10000)
                    });
                    
                    if (!captionResponse.ok) {
                      throw new Error(`Failed to fetch caption data: ${captionResponse.status}`);
                    }
                    
                    // Process the XML transcript data
                    const captionData = await captionResponse.text();
                    const textMatches = captionData.match(/<text[^>]*>(.*?)<\/text>/g) || [];
                    
                    if (textMatches.length > 0) {
                      console.log(`Found ${textMatches.length} caption segments`);
                      
                      const transcript = textMatches
                        .map((match: string) => {
                          // Extract text content and decode HTML entities
                          const content = match.replace(/<[^>]*>/g, '');
                          return content.replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'");
                        })
                        .join(' ');
                      
                      if (transcript.length > 0) {
                        return transcript;
                      }
                    }
                  }
                }
              } catch (parseError) {
                console.error('Error parsing caption tracks:', parseError);
              }
            }
            
            // If we couldn't extract captions from the page, try the timedtext API directly
            try {
              // Try different language codes
              for (const lang of ['en', 'en-US', '']) {
                try {
                  const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`;
                  
                  const timedTextResponse = await fetch(timedTextUrl, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                      'Referer': videoUrl
                    },
                    signal: AbortSignal.timeout(10000)
                  });
                  
                  if (!timedTextResponse.ok) {
                    console.log(`Failed to fetch timedtext with lang=${lang}: ${timedTextResponse.status}`);
                    continue;
                  }
                  
                  const textData = await timedTextResponse.text();
                  
                  if (textData && textData.includes('<text')) {
                    // Process XML format
                    const textMatches = textData.match(/<text[^>]*>(.*?)<\/text>/g) || [];
                    
                    if (textMatches.length > 0) {
                      const transcript = textMatches
                        .map((match: string) => {
                          const content = match.replace(/<[^>]*>/g, '');
                          return content.replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'");
                        })
                        .join(' ');
                      
                      if (transcript.length > 0) {
                        return transcript;
                      }
                    }
                  }
                } catch (langError) {
                  console.log(`Failed to fetch transcript with language ${lang}:`, langError);
                }
              }
            } catch (timedTextError) {
              console.error('Error fetching from timedtext API:', timedTextError);
            }
            
            // If we get here, all methods have failed
            throw new Error('Failed to extract transcript with any method. The video may not have captions available.');
          }
        } finally {
          // Restore the original agents regardless of success/failure
          https.globalAgent = originalHttpsAgent;
          http.globalAgent = originalHttpAgent;
        }
      } catch (error) {
        console.error('SmartProxy error:', error);
        
        // Final fallback: try without proxy
        console.log('Trying fallback without proxy...');
        
        try {
          const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
          
          if (!transcriptArray || transcriptArray.length === 0) {
            throw new Error('No transcript available for this video.');
          }
          
          const transcript = transcriptArray
            .map((item: { text: string }) => item.text)
            .join(' ');
            
          return transcript;
        } catch (fallbackError) {
          console.error('Fallback transcript fetch failed:', fallbackError);
          throw new Error(`Failed to fetch transcript: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } else {
      // Standard approach for local development
      console.log('Using standard transcript fetch (local development)');
      const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcriptArray || transcriptArray.length === 0) {
        throw new Error('No transcript available for this video.');
      }

      const transcript = transcriptArray
        .map((item: { text: string }) => item.text)
        .join(' ');

      return transcript;
    }
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
}

async function generateSummary(
  transcript: string, 
  userTier: string, 
  openai: OpenAI,
  quickMode: boolean = false
): Promise<string> {
  const modelsByTier = {
    'Basic': ['gpt-3.5-turbo'],
    'Plus': ['gpt-4o-mini', 'gpt-3.5-turbo'],
    'Pro': ['gpt-4-turbo', 'gpt-4', 'gpt-4-0613', 'gpt-3.5-turbo']
  };

  // In quick mode, prefer faster models
  const modelOptions = quickMode 
    ? ['gpt-3.5-turbo'] 
    : (modelsByTier[userTier as keyof typeof modelsByTier] || ['gpt-3.5-turbo']);
  
  const modelTokenLimits = {
    'gpt-4-turbo': 25000,
    'gpt-4': 7000,
    'gpt-4-0613': 7000,
    'gpt-4o-mini': 15000,
    'gpt-3.5-turbo': 12000
  };
  
  // System and prompt tokens (approximate)
  const systemAndPromptTokens = 500;
  
  let lastError = null;
  
  for (const model of modelOptions) {
    try {
      const maxTokenLimit = modelTokenLimits[model as keyof typeof modelTokenLimits] || 4000;
      const availableTokensForTranscript = maxTokenLimit - systemAndPromptTokens;
      
      // In quick mode, use a smaller portion of the transcript
      const estimatedTranscriptTokens = Math.ceil(transcript.length / 4);
      
      let processedTranscript = transcript;
      if (estimatedTranscriptTokens > availableTokensForTranscript || quickMode) {
        // For quick mode, use an even smaller portion
        const truncationRatio = quickMode 
          ? Math.min(0.5, availableTokensForTranscript / estimatedTranscriptTokens) 
          : availableTokensForTranscript / estimatedTranscriptTokens;
        
        const charsToKeep = Math.floor(transcript.length * truncationRatio * 0.9); // 10% safety margin
        processedTranscript = transcript.substring(0, charsToKeep) + 
          "\n\n[Transcript truncated due to length limitations]";
      }
      
      const promptContent = quickMode
        ? `Provide a concise summary of the following transcript. Include the main points and brief action steps if applicable. Use markdown format with a title, summary section, and short action steps. Use emojis for the title and action steps. ALWAYS WRITE IN ENGLISH:

## Title:

## Summary:

[Your concise summary here]

## Quick Action Steps:

1. [First action]
2. [Second action]
3. [Third action]

Transcript:
       
${processedTranscript}`
        : `Summarize the following transcript and provide actionable steps if applicable in detail with relevant examples. ALWAYS WRITE YOUR RESPONSE IN ENGLISH, even if the transcript is in another language. Use the following markdown format, use suitable emojis alongside the action steps and title:
          :

## Title:

## Summary:

[Your summary content here]

## Action Steps:

1. [First action step]
2. [Second action step]
3. [Third action step]
...

Transcript:
       
${processedTranscript}`;

      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: quickMode
              ? 'You are a helpful assistant that provides brief, concise summaries of YouTube video transcripts. Format your response in markdown with a title, summary section, and brief action steps. Use emojis where appropriate. Keep everything concise but informative. ALWAYS OUTPUT IN ENGLISH.'
              : 'You are a helpful assistant that summarizes YouTube video transcripts in detail highlighting the key points and provides actionable steps if applicable that the user can take. Format your response in markdown with specific headers and numbering. ALWAYS OUTPUT IN ENGLISH regardless of the input language. Translate the transcript to English if it is in another language. Do not include words like "Transcript Includes" in your response.',
          },
          {
            role: 'user',
            content: promptContent,
          },
        ],
      });

      const summary = response.choices[0].message?.content || '';
      return summary;
      
    } catch (error: any) {
      console.error(`Error with model ${model}:`, error.message);
      lastError = error;
      
      // Check for different types of rate limit errors
      const isRateLimitError = 
        error.message.includes('rate_limit_exceeded') || 
        error.message.includes('capacity') ||
        error.message.includes('Request too large') ||
        error.message.includes('tokens per min') ||
        error.message.includes('TPM');
      
      if (!isRateLimitError) {
        throw error;
      }
      
      if (model === modelOptions[modelOptions.length - 1]) {
        throw new Error(`All available models are rate limited or exceeded token limits. Please try again later. Last error: ${error.message}`);
      }
      
    }
  }
  
  throw lastError || new Error('Failed to generate summary with any available model');
}
