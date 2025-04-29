/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from '@/src/lib/youtube-transcript';
import { db } from '@/src/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Simple API response cache
interface CacheEntry {
  timestamp: number;
  response: any;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const responseCache = new Map<string, CacheEntry>();

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(req: NextRequest) {
  console.log('Received summarize request:', isDevelopment ? '(Development Mode)' : '(Production Mode)');
  
  try {
    // Parse request first to get URL for caching
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request:', parseError);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { url, quickMode } = requestData;
    if (!url) {
      return NextResponse.json({ error: 'Missing YouTube URL' }, { status: 400 });
    }
    
    // Create a cache key for this request
    const cacheKey = `${url}_${quickMode ? 'quick' : 'full'}`;
    
    // Check cache first (skip cache in development mode for easier testing)
    if (!isDevelopment) {
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
        console.log('Using cached summary response');
        return NextResponse.json(cachedResponse.response);
      }
    }
    
    // Validate user and permissions
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      console.error('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get everything we need from the database in one go for better performance
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true,
        openaiApiKey: true, 
        stripePriceId: true, 
        planName: true, 
        usedQuota: true
      },
    });

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

    // Initialize OpenAI only once
    let openai: any;
    try {
      openai = new OpenAI({ apiKey: dbUser.openaiApiKey });
    } catch (apiError) {
      console.error('Error initializing OpenAI client:', apiError);
      return NextResponse.json({ error: 'Invalid OpenAI API key configuration.' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Fetch transcript with improved performance
    let transcript: string;
    try {
      const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, { 
        useProxy: !isDevelopment,
        skipCache: isDevelopment,
        forceNoProxy: isDevelopment
      });
      
      if (!transcriptArray || transcriptArray.length === 0) {
        throw new Error('No transcript available for this video.');
      }
      
      // Join all transcript items directly, more efficiently
      transcript = transcriptArray.map(item => item.text).join(' ');
    } catch (transcriptError: any) {
      console.error('Transcript fetch error:', transcriptError);
      return NextResponse.json({ error: transcriptError.message }, { status: 400 });
    }

    // Calculate tier and quota only if we need to
    const tier = dbUser.planName?.includes('Pro') ? 'Pro' : 'Basic';
    const totalQuota = tier === 'Pro' ? Infinity : 100;

    if (dbUser.usedQuota >= totalQuota && totalQuota !== Infinity) {
      return NextResponse.json({ error: 'You have reached your summary quota. Please upgrade your plan.' }, { status: 403 });
    }

    // Check rate limit only once per minute to reduce DB calls
    const now = new Date();
    const rateLimit = tier === 'Pro' ? 60 : 10;
    
    const userRequests = await db.apiRequest.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(now.getTime() - 60 * 1000) },
      },
    });

    if (userRequests > rateLimit) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    // Generate summary with optimized OpenAI call
    const content = await generateSummary(transcript, tier, openai, quickMode);

    // Update database with results - do in one transaction for efficiency
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { usedQuota: { increment: 1 } } }),
      db.summary.create({ data: { title: content.split('\n')[0], content, userId: user.id } }),
      db.apiRequest.create({ data: { userId: user.id } }),
    ]);

    // Create the response object
    const responseData = { summary: { id: Date.now().toString(), content }, transcript };
    
    // Store in cache (except in development)
    if (!isDevelopment) {
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        response: responseData
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
  }
}

function extractVideoId(url: string): string | null {
  // Quick check for already-extracted IDs
  if (url.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  // Otherwise do regex match
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function generateSummary(transcript: string, userTier: string, openai: any, quickMode: boolean = false): Promise<string> {
  const modelsByTier = {
    'Basic': ['gpt-3.5-turbo'],
    'Plus': ['gpt-4o-mini', 'gpt-3.5-turbo'],
    'Pro': ['gpt-4-turbo', 'gpt-4', 'gpt-4-0613', 'gpt-3.5-turbo'],
  };
  
  // Choose appropriate model based on tier and mode
  const modelOptions = quickMode ? ['gpt-3.5-turbo'] : (modelsByTier[userTier as keyof typeof modelsByTier] || ['gpt-3.5-turbo']);
  
  // Update token limits with max completion token limits
  const modelTokenLimits = { 
    'gpt-4-turbo': 128000, 
    'gpt-4': 8192, 
    'gpt-4-0613': 8192, 
    'gpt-4o-mini': 16385, 
    'gpt-3.5-turbo': 16385 
  };
  
  // Max completion tokens for each model (must be <= 4096 for most models)
  const maxCompletionTokens = {
    'gpt-4-turbo': 4096,
    'gpt-4': 4096,
    'gpt-4-0613': 4096,
    'gpt-4o-mini': 4096,
    'gpt-3.5-turbo': 4096
  };

  const systemAndPromptTokens = 500; // Approximate tokens for system and prompt text

  for (const model of modelOptions) {
    try {
      // Get the context limit for this model
      const contextLimit = modelTokenLimits[model as keyof typeof modelTokenLimits] || 4096;
      
      // Calculate safe max_tokens value (never more than the model allows)
      const safeMaxTokens = Math.min(
        maxCompletionTokens[model as keyof typeof maxCompletionTokens] || 2048,
        Math.floor(contextLimit / 3)  // Use at most 1/3 of context for completion
      );
      
      // Calculate available tokens for input
      const availableInputTokens = contextLimit - systemAndPromptTokens - safeMaxTokens;

      // Process transcript more efficiently - use simpler calculation
      let processedTranscript = transcript;
      if (transcript.length > availableInputTokens * 3 || quickMode) {
        // Rough character to token ratio of about 3-4 chars per token
        const targetLength = quickMode ? transcript.length * 0.4 : Math.floor(availableInputTokens * 3.5);
        processedTranscript = transcript.substring(0, targetLength) + '\n\n[Transcript truncated]';
      }

      // Simplified prompts for better performance
      const promptContent = quickMode ?
        `YouTube transcript summary, concise format with title and 3 key points. Use emojis.\n\n${processedTranscript}` :
        `Summarize this YouTube transcript with a title, detailed summary, and action steps.\n\n${processedTranscript}`;

      console.log(`Using model ${model} with max_tokens=${safeMaxTokens}`);
      
      // Optimized OpenAI call with safe token limits
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Create summaries in English with a title, summary section, and action steps.' },
          { role: 'user', content: promptContent },
        ],
        temperature: 0.7,
        max_tokens: safeMaxTokens
      });

      return response.choices[0].message?.content || '';
    } catch (error: any) {
      console.error(`Error with model ${model}:`, error.message);
      if (model === modelOptions[modelOptions.length - 1]) throw new Error('All models failed. Try again later.');
    }
  }
  throw new Error('Failed to generate summary.');
} 