import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Select model based on tier
    const model = 
      ({
        Basic: 'gpt-3.5-turbo',
        Plus: 'gpt-4-turbo-preview',
        Pro: 'gpt-4o',
      } as const)[tier as 'Basic' | 'Plus' | 'Pro'] || 'gpt-3.5-turbo';

    const { message, transcript, summary } = await req.json();

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant answering questions about a YouTube video's content. 
          Use the transcript as your main reference. Answer questions that are directly based on the transcript, as well as questions about the themes, topics, or ideas suggested by the transcript—even if the details are not stated explicitly. 
          If a question isn't directly in the transcript but relates to its themes, provide an answer based on that connection. However, if a question is completely unrelated to the video's content, explain politely that you can only answer questions about the video's content. Avoid making assumptions or adding details beyond what the transcript and its related themes support.
          
          SUMMARY:
          ${summary}
          
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
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the chat' },
      { status: 500 }
    );
  }
}
