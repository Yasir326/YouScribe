import { NextResponse } from 'next/server'

// In a real-world application, you would use a database to store likes
const likes: Record<string, number> = {}

export async function POST(req: Request) {
  try {
    const { summaryId } = await req.json()

    if (!summaryId) {
      return NextResponse.json({ error: 'Summary ID is required' }, { status: 400 })
    }

    // Increment the like count for the given summaryId
    likes[summaryId] = (likes[summaryId] || 0) + 1

    return NextResponse.json({ likes: likes[summaryId] })
  } catch (error) {
    console.error('Error processing like:', error)
    return NextResponse.json({ error: 'An error occurred while processing the like' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const summaryId = searchParams.get('summaryId')

  if (!summaryId) {
    return NextResponse.json({ error: 'Summary ID is required' }, { status: 400 })
  }

  return NextResponse.json({ likes: likes[summaryId] || 0 })
}