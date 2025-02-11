import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, transcript, summary } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant specifically answering questions about a YouTube video's content. 
          You must ONLY answer questions based on the information provided in the transcript or answer questions related to the theme and topics of the transcript.
          If the question is not related to the video's content, politely explain that you can only answer questions about the video's content.
          Do not make assumptions or provide information beyond what is contained in these materials.
          
          SUMMARY:
          ${summary}
          
          TRANSCRIPT:
          ${transcript}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return NextResponse.json({ 
      reply: response.choices[0].message?.content || 'No response generated'
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the chat' },
      { status: 500 }
    );
  }
} 