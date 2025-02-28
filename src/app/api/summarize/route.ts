/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { PrismaClient } from '@prisma/client';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has configured OpenAI API key
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        openaiApiKey: true,
        stripePriceId: true
      }
    });

    if (!dbUser?.openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your API key in the dashboard settings.' },
        { status: 400 }
      );
    }

    // Initialize OpenAI with user's API key
    const openai = new OpenAI({
      apiKey: dbUser.openaiApiKey,
    });

    const { url } = await req.json();

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

    // Get user's subscription tier from database
    const userSubscription = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        stripePriceId: true
      }
    });

    // Map price IDs to tiers
    const tier = userSubscription?.stripePriceId ? 
      (userSubscription.stripePriceId.includes('Pro') ? 'Pro' : 
       userSubscription.stripePriceId.includes('Plus') ? 'Plus' : 'Basic') 
      : 'Basic';

    console.log('User tier:', tier);

    // Generate summary using OpenAI
    const content = await generateSummary(transcript, tier, openai);

    // Create the summary without specifying the id field
    await prisma.summary.create({
      data: {
        title: content.split('\n')[0],
        content: content,
        userId: user.id,
      },
    });

    // Return the summary data
    const summary = {
      title: content.split('\n')[0],
      content: content,
    };

    return NextResponse.json({ summary });
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
  openai: OpenAI
): Promise<string> {
  const model = {
    'Basic': 'gpt-3.5-turbo',
    'Plus': 'gpt-4o',
    'Pro': 'gpt-4-turbo-preview'
  }[userTier] || 'gpt-3.5-turbo';

  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that summarizes YouTube video transcripts in detail highlighting the key points and provides actionable steps if applicable that the user can take. Format your response in markdown with specific headers and numbering. ALWAYS OUTPUT IN ENGLISH regardless of the input language. Translate the transcript to English if it is in another language. Do not include words like "Transcript Includes" in your response.',
      },
      {
        role: 'user',
        content: `Summarize the following transcript and provide actionable steps if applicable in detail with relevant examples. ALWAYS WRITE YOUR RESPONSE IN ENGLISH, even if the transcript is in another language. Use the following markdown format, use suitable emojis alongside the action steps and title:
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
   
${transcript}`,
      },
    ],
  });

  const summary = response.choices[0].message?.content || '';
  console.log('User tier:', userTier);
  console.log('Generated summary:', summary);
  return summary;
}
