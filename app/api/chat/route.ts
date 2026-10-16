import { NextRequest, NextResponse } from 'next/server';
import { getChatReply, type ChatMessage } from '@/lib/pollinations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const source = Array.isArray(body?.messages) ? body.messages : [];
    const safe: ChatMessage[] = source.slice(-12).flatMap((item: unknown) => {
      if (!item || typeof item !== 'object') return [];
      const value = item as { role?: unknown; content?: unknown };
      if ((value.role !== 'user' && value.role !== 'assistant') || typeof value.content !== 'string') return [];
      const content = value.content.trim().slice(0, 5000);
      return content ? [{ role: value.role, content }] : [];
    });
    if (!safe.length || safe[safe.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'Apna sawal likho.' }, { status: 400 });
    }
    safe.unshift({
      role: 'system',
      content: 'You are Ankit Kryptex AI, a friendly helpful assistant. Reply in the language used by the user, usually Hindi or Hinglish. Be clear, honest, and concise. Do not claim you created files or performed actions you did not perform. For image creation requests, tell the user to use the image mode only if no image is included in this request.'
    });
    const reply = await getChatReply(safe);
    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI service se connect nahi ho paya.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
