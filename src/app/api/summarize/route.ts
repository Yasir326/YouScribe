/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
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

    // Generate summary using OpenAI
    const content = await generateSummary(transcript);

    const summary = {
      id: videoId,
      title: content.split('\n')[0],
      content: content,
    };

    await prisma.summary.create({
      data: {
        id: summary.id,
        title: summary.title,
        content: summary.content,
      }
    })

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

async function generateSummary(transcript: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that summarizes YouTube video transcripts in detail and provides actionable steps if applicable that the user can take. Format your response in markdown with specific headers and numbering.',
      },
      {
        role: 'user',
        content: `Summarize the following transcript and provide actionable steps if applicable in detail with relevant examples. Use the following markdown format, use suitable emojis alongside the action steps and title:
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
  return summary;
}
