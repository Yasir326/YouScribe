import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { db } from '@/src/db';

// Ensure function is wrapped correctly for route handler
export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSubscription = await db.user.findUnique({
      where: { id: user.id },
      select: {
        openaiApiKey: true,
        stripePriceId: true,
        planName: true
      }
    });

    if (!userSubscription?.openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add your API key in the dashboard settings.' },
        { status: 400 }
      );
    }

    let openai: OpenAI;
    try {
      openai = new OpenAI({
        apiKey: userSubscription.openaiApiKey || '',
      });
    } catch (apiError) {
      console.error('Error initializing OpenAI client:', apiError);
      return NextResponse.json(
        { error: 'Invalid OpenAI API key configuration.' },
        { status: 400 }
      );
    }
    
    const tier = userSubscription.planName || 'Basic';

    // Select model based on tier
    const model = 
      ({
        Basic: 'gpt-3.5-turbo',
        Plus: 'gpt-4-turbo-preview',
        Pro: 'gpt-4o',
      } as const)[tier as 'Basic' | 'Plus' | 'Pro'] || 'gpt-3.5-turbo';

    let messageData;
    try {
      messageData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { message, transcript, summary } = messageData;

    if (!message || !transcript) {
      return NextResponse.json(
        { error: 'Missing required fields: message and transcript' },
        { status: 400 }
      );
    }

    try {
      const response = await openai.chat.completions.create({
        model: model,
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
        max_tokens: 500,
      });

      return NextResponse.json({
        reply: response.choices[0].message?.content || 'No response generated',
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json(
        { error: 'An error occurred while processing your request with the AI service' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the chat' },
      { status: 500 }
    );
  }
}
