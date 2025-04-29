import { NextResponse } from 'next/server';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Simple health check endpoint
 */
export function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  });
}
