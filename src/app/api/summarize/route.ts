/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { db } from '@/src/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

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
    // For production environments, use SmartProxy if configured
    if (process.env.NODE_ENV === 'production' && process.env.SMARTPROXY_USERNAME && process.env.SMARTPROXY_PASSWORD) {
      console.log('Using SmartProxy for YouTube transcript fetch');
      
      // Set up HTTP_PROXY environment variable for Node.js
      // Node.js native fetch and many libraries respect this environment variable
      const proxyUrl = `http://${process.env.SMARTPROXY_USERNAME}:${process.env.SMARTPROXY_PASSWORD}@gate.smartproxy.com:10001`;
      process.env.HTTP_PROXY = proxyUrl;
      // Also set HTTPS_PROXY as some libraries use this instead
      process.env.HTTPS_PROXY = proxyUrl;
      
      try {
        // With HTTP_PROXY set, standard fetch will use the proxy
        const testResponse = await fetch('https://ip.smartproxy.com/json');
        if (!testResponse.ok) {
          throw new Error(`Proxy test failed with status: ${testResponse.status}`);
        }
        
        const proxyInfo = await testResponse.json();
        console.log('SmartProxy connection successful. IP:', proxyInfo.ip);
        
        try {
          // Try the standard transcript fetch first
          console.log('Attempting standard transcript fetch');
          const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
          
          if (!transcriptArray || transcriptArray.length === 0) {
            throw new Error('No transcript available for this video.');
          }
          
          const transcript = transcriptArray
            .map((item: { text: string }) => item.text)
            .join(' ');
            
          return transcript;
        } catch (transcriptError) {
          // The standard method failed, try an alternative approach with explicit cookies and headers
          console.log('Standard transcript fetch failed, trying alternative method', transcriptError);
          
          // First, fetch the YouTube page to get cookies and other necessary tokens
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          
          console.log('Fetching YouTube page with proxy...');
          const videoPageResponse = await fetch(videoUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Ch-Ua': '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Fetch-User': '?1',
              'Upgrade-Insecure-Requests': '1'
            }
          });
          
          if (!videoPageResponse.ok) {
            console.log(`Failed to fetch video page: ${videoPageResponse.status}`);
            
            // Let's try a fallback to directly use the local method but with a modified video ID
            // This is a workaround for testing - if proxy isn't working properly
            console.log('Attempting fallback to direct transcript fetch');
            delete process.env.HTTP_PROXY;
            delete process.env.HTTPS_PROXY;
            
            try {
              const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
              
              if (!transcriptArray || transcriptArray.length === 0) {
                throw new Error('No transcript available for this video (fallback method).');
              }
              
              const transcript = transcriptArray
                .map((item: { text: string }) => item.text)
                .join(' ');
                
              return transcript;
            } catch (fallbackError) {
              console.error('Fallback direct fetch also failed:', fallbackError);
              throw new Error(`Failed to fetch video page: ${videoPageResponse.status}`);
            }
          }
          
          // Get cookies from the response
          const cookies = videoPageResponse.headers.get('set-cookie');
          console.log('Cookies obtained:', cookies ? 'Yes' : 'No');
          
          // Get the page content to look for YouTube's client config variables
          const pageContent = await videoPageResponse.text();
          console.log(`Page content received: ${pageContent.length} characters`);
          
          // Try another endpoint that might provide captions/transcript
          console.log('Trying YouTube timedtext API...');
          
          // Try multiple languages if the first one doesn't work
          const languages = ['en', 'en-US', 'en-GB', 'auto', ''];
          
          for (const lang of languages) {
            try {
              // Try a direct request to the transcript endpoint with these cookies
              const transcriptApiUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`;
              console.log(`Trying transcript API with lang=${lang}`);
              
              const transcriptResponse = await fetch(transcriptApiUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Accept': '*/*',
                  'Cookie': cookies || '',
                  'Referer': videoUrl
                }
              });
              
              if (!transcriptResponse.ok) {
                console.log(`API attempt with lang=${lang} failed: ${transcriptResponse.status}`);
                continue;
              }
              
              // Process the transcript response
              const transcriptData = await transcriptResponse.text();
              console.log(`Transcript data received: ${transcriptData.length} characters`);
              
              // If we successfully got something, return it
              if (transcriptData && transcriptData.length > 0) {
                // Simple processing - might need to be adjusted based on the actual response format
                console.log('Alternative transcript fetch succeeded');
                
                // Try to parse XML if we got XML response
                if (transcriptData.includes('<transcript>') || transcriptData.includes('<text')) {
                  // Very basic XML parsing for demonstration
                  const textMatches = transcriptData.match(/<text[^>]*>(.*?)<\/text>/g) || [];
                  
                  if (textMatches.length > 0) {
                    console.log(`Found ${textMatches.length} text elements in XML`);
                    const transcript = textMatches
                      .map(match => {
                        // Extract text content from the XML tags
                        const content = match.replace(/<[^>]*>/g, '');
                        // Decode HTML entities
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
                
                // If it wasn't XML or parsing failed, let's check if we got JSON
                try {
                  const jsonData = JSON.parse(transcriptData);
                  if (jsonData && typeof jsonData === 'object') {
                    console.log('Received JSON data for transcript');
                    // Extract the text content based on the JSON format (this will depend on YouTube's API format)
                    // This is a simplistic example and may need adjustment
                    if (jsonData.events) {
                      const transcript = jsonData.events
                        .filter((event: any) => event.segs && event.segs.length)
                        .map((event: any) => 
                          event.segs.map((seg: any) => seg.utf8).join(' ')
                        )
                        .join(' ');
                      
                      if (transcript.length > 0) {
                        return transcript;
                      }
                    }
                  }
                } catch (jsonError) {
                  console.log('Not a JSON response', jsonError);
                }
                
                // Last resort: Return some excerpt of the raw text if it's not too long
                if (transcriptData.length < 5000) {
                  return `Transcript data retrieved but format handling needed: ${transcriptData.substring(0, 500)}...`;
                } else {
                  return `Transcript data retrieved but too large to return directly (${transcriptData.length} chars)`;
                }
              }
            } catch (langError) {
              console.log(`Error trying language ${lang}:`, langError);
            }
          }
          
          // If we've tried all languages but got here, try one final approach - extract from page content
          console.log('Trying to extract transcript data from page content...');
          
          // Look for the captionTracks in the YouTube player response
          const captionTracksMatch = pageContent.match(/"captionTracks":\s*(\[.*?\])(?=,)/);
          if (captionTracksMatch && captionTracksMatch[1]) {
            try {
              const captionTracks = JSON.parse(captionTracksMatch[1]);
              if (captionTracks && captionTracks.length) {
                // Get the first English track or any track if no English
                const track = captionTracks.find((t: any) => 
                  t.languageCode && (t.languageCode.includes('en') || t.name.simpleText.includes('English'))
                ) || captionTracks[0];
                
                if (track && track.baseUrl) {
                  console.log('Found caption track URL in page content, fetching...');
                  const captionResponse = await fetch(track.baseUrl);
                  if (captionResponse.ok) {
                    const captionData = await captionResponse.text();
                    
                    // Basic XML parsing for caption data
                    const textMatches = captionData.match(/<text[^>]*>(.*?)<\/text>/g) || [];
                    
                    if (textMatches.length > 0) {
                      console.log(`Found ${textMatches.length} text elements in captions`);
                      const transcript = textMatches
                        .map(match => {
                          // Extract text content from the XML tags
                          const content = match.replace(/<[^>]*>/g, '');
                          // Decode HTML entities
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
              }
            } catch (captionParseError) {
              console.log('Error parsing caption tracks:', captionParseError);
            }
          }
          
          // If we got here, all methods failed
          throw new Error('All transcript extraction methods failed. The video may not have available transcripts or YouTube is blocking access.');
        }
      } catch (error) {
        // Type assertion for the error to handle message property
        const err = error as Error;
        console.error('SmartProxy error:', err.message);
        throw new Error(`Failed to fetch transcript through SmartProxy: ${err.message}`);
      } finally {
        // Clean up the environment variables when done
        delete process.env.HTTP_PROXY;
        delete process.env.HTTPS_PROXY;
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
