import { NextRequest, NextResponse } from 'next/server';
import { runChat } from '@/lib/chat-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await runChat(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'AI generation request failed' },
      { status: 500 }
    );
  }
}
