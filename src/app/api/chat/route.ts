import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { db } from '@/src/db';
import { openai } from '@/src/lib/openai';

// Export a dynamic config to tell Next.js this route should not be statically analyzed
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Handle POST requests to the chat API
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { message, transcript, summary } = body;

    if (!message || !transcript) {
      console.error('Missing required fields:', {
        hasMessage: !!message,
        hasTranscript: !!transcript,
      });
      return NextResponse.json(
        { error: 'Missing required fields (message and transcript are required)' },
        { status: 400 }
      );
    }

    // Get the user's subscription details
    const userSubscription = await db.user.findUnique({
      where: { id: user.id },
      select: {
        stripePriceId: true,
        planName: true,
      },
    });

    if (!userSubscription) {
      console.error('User subscription not found');
      return NextResponse.json({ error: 'User subscription not found' }, { status: 400 });
    }

    // Select model based on user tier
    const tier = userSubscription.planName || 'Basic';
    const model = (() => {
      if (tier === 'Pro') return 'gpt-4o-mini';
      return 'gpt-3.5-turbo'; // Default for Basic
    })();

    console.log('Using model based on tier:', { tier, model });


    // Make OpenAI request
    console.log('Making OpenAI API request');
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant answering questions about a YouTube video's content. 
          Use the transcript as your main reference. Answer questions that are directly based on the transcript, as well as questions about the themes, topics, or ideas suggested by the transcript—even if the details are not stated explicitly. 
          If a question isn't directly in the transcript but relates to its themes, provide an answer based on that connection. However, if a question is completely unrelated to the video's content, explain politely that you can only answer questions about the video's content. Avoid making assumptions or adding details beyond what the transcript and its related themes support.
          
          SUMMARY:
          ${summary || 'No summary provided'}
          
          TRANSCRIPT:
          ${transcript}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: tier === 'Pro' ? 1000 : 500, // Increased token limit for Pro tier
    });

    // Return AI response
    console.log('Successfully generated chat response');
    return NextResponse.json({
      reply: response.choices[0].message?.content || 'No response generated',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: `Chat API error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
