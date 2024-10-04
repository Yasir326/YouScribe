/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { YoutubeTranscript } from 'youtube-transcript';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    // Extract video ID from URL
    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Get transcript
    let transcript: string;
    try {
      transcript = await getTranscript(videoId)
    } catch (transcriptError: any) {
      return NextResponse.json({ error: transcriptError.message }, { status: 400 })
    }

    // Generate summary using OpenAI
    const summary = await generateSummary(transcript)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 })
  }
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

async function getTranscript(videoId: string): Promise<string> {
  try {
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptArray || transcriptArray.length === 0) {
      throw new Error('No transcript available for this video.');
    }

    // Combine all transcript parts into a single string
    const transcript = transcriptArray
      .map((item: { text: string }) => item.text)
      .join(' ');

    return transcript;
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
}

// The generateSummary function remains the same
async function generateSummary(transcript: string): Promise<{ content: string; actionSteps: string[] }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that summarizes YouTube video transcripts and provides actionable steps.' },
      { role: 'user', content: `Summarize the following transcript and provide 3-5 actionable steps:\n\n${transcript}` },
    ],
  })

  const summary = response.choices[0].message?.content || ''
  console.log('summary', summary)

  // Check if 'Actionable Steps:' is present in the summary
  if (summary.includes('Actionable Steps:')) {
    const [content, actionStepsRaw] = summary.split('Actionable Steps:')
    const actionSteps = actionStepsRaw
      .split('\n')
      .filter(step => step.trim().length > 0)
      .map(step => step.replace(/^\d+\.\s*/, '').trim())

    return { content: content.trim(), actionSteps }
  } else {
    // If 'Actionable Steps:' is not present, return the whole summary as content and an empty array for actionSteps
    return { content: summary.trim(), actionSteps: [] }
  }
}