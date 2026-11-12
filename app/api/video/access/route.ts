import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Temporary free-access switch for the Video Studio.
export async function GET() {
  return NextResponse.json({ premium: true, temporaryFree: true }, { headers: { 'Cache-Control': 'no-store' } });
}
