/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { db } from '@/src/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptArray || transcriptArray.length === 0) {
      throw new Error('No transcript available for this video.');
    }

   
    const transcript = transcriptArray
      .map((item: { text: string }) => item.text)
      .join(' ');

    return transcript;
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
