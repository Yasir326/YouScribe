/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpsProxyAgent } from 'https-proxy-agent';
const proxyAgent = new HttpsProxyAgent(`http://${process.env.SMARTPROXY_USERNAME}:${process.env.SMARTPROXY_PASSWORD}@us.smartproxy.com:10000`);
const originalFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (url: any, options: any = {}) => {
  const needsProxy = typeof url === 'string' && url.includes('youtube.com');
  const opts = needsProxy ? { ...options, agent: proxyAgent } : options;
  return originalFetch(url, opts);
};

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { db } from '@/src/db';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

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

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { openaiApiKey: true, stripePriceId: true, planName: true, usedQuota: true },
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

    let openai: OpenAI;
    try {
      openai = new OpenAI({ apiKey: dbUser.openaiApiKey });
    } catch (apiError) {
      console.error('Error initializing OpenAI client:', apiError);
      return NextResponse.json({ error: 'Invalid OpenAI API key configuration.' }, { status: 400 });
    }

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

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    let transcript: string;
    try {
      transcript = await getTranscript(videoId);
    } catch (transcriptError: any) {
      console.error('Transcript fetch error:', transcriptError);
      return NextResponse.json({ error: transcriptError.message }, { status: 400 });
    }

    const tier = dbUser.planName?.includes('Pro') ? 'Pro' : 'Basic';
    const totalQuota = tier === 'Pro' ? Infinity : 100;

    if (dbUser.usedQuota >= totalQuota && totalQuota !== Infinity) {
      return NextResponse.json({ error: 'You have reached your summary quota. Please upgrade your plan.' }, { status: 403 });
    }

    const userRequests = await db.apiRequest.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    const rateLimit = tier === 'Pro' ? 60 : 10;
    if (userRequests > rateLimit) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    const content = await generateSummary(transcript, tier, openai, quickMode);

    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { usedQuota: { increment: 1 } } }),
      db.summary.create({ data: { title: content.split('\n')[0], content, userId: user.id } }),
      db.apiRequest.create({ data: { userId: user.id } }),
    ]);

    return NextResponse.json({ summary: { id: Date.now().toString(), content }, transcript });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
  }
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function getTranscript(videoId: string): Promise<string> {
  const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
  if (!transcriptArray || transcriptArray.length === 0) {
    throw new Error('No transcript available for this video.');
  }
  return transcriptArray.map(item => item.text).join(' ');
}

async function generateSummary(transcript: string, userTier: string, openai: OpenAI, quickMode: boolean = false): Promise<string> {
  const modelsByTier = {
    'Basic': ['gpt-3.5-turbo'],
    'Plus': ['gpt-4o-mini', 'gpt-3.5-turbo'],
    'Pro': ['gpt-4-turbo', 'gpt-4', 'gpt-4-0613', 'gpt-3.5-turbo'],
  };

  const modelOptions = quickMode ? ['gpt-3.5-turbo'] : (modelsByTier[userTier as keyof typeof modelsByTier] || ['gpt-3.5-turbo']);
  const modelTokenLimits = { 'gpt-4-turbo': 25000, 'gpt-4': 7000, 'gpt-4-0613': 7000, 'gpt-4o-mini': 15000, 'gpt-3.5-turbo': 12000 };
  const systemAndPromptTokens = 500;

  for (const model of modelOptions) {
    try {
      const maxTokenLimit = modelTokenLimits[model as keyof typeof modelTokenLimits] || 4000;
      const availableTokens = maxTokenLimit - systemAndPromptTokens;

      let processedTranscript = transcript;
      if (Math.ceil(transcript.length / 4) > availableTokens || quickMode) {
        const truncationRatio = quickMode ? 0.5 : availableTokens / Math.ceil(transcript.length / 4);
        const charsToKeep = Math.floor(transcript.length * truncationRatio * 0.9);
        processedTranscript = transcript.substring(0, charsToKeep) + '\n\n[Transcript truncated]';
      }

      const promptContent = quickMode ?
        `Provide a concise summary in markdown with a title, summary, and 3 action steps. Use emojis. ALWAYS WRITE IN ENGLISH.\n\nTranscript:\n${processedTranscript}` :
        `Summarize this transcript in markdown format with a title, summary, and detailed action steps. Translate if needed. ALWAYS WRITE IN ENGLISH.\n\nTranscript:\n${processedTranscript}`;

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: quickMode ?
            'You are a helpful assistant creating short summaries.' :
            'You are a helpful assistant creating detailed summaries with action steps.' },
          { role: 'user', content: promptContent },
        ],
      });

      return response.choices[0].message?.content || '';
    } catch (error: any) {
      console.error(`Error with model ${model}:`, error.message);
      if (model === modelOptions[modelOptions.length - 1]) throw new Error('All models failed. Try again later.');
    }
  }
  throw new Error('Failed to generate summary.');
}
