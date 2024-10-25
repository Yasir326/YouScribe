import { NextResponse } from 'next/server';
import { db } from '@/src/db';

export async function POST(req: Request) {
  const { title, content } = await req.json();
  const summary = await db.summary.create({
    data: { title, content },
  });
  return NextResponse.json(summary, { status: 201 });
}

export async function GET() {
  const summaries = await db.summary.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(summaries);
}