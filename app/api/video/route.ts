import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createAgnesVideo } from '@/lib/agnes';
import { isPremiumCookieValid, PREMIUM_COOKIE } from '@/lib/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hasPremium = isPremiumCookieValid(cookies().get(PREMIUM_COOKIE)?.value);
    if (!hasPremium) {
      return NextResponse.json({ error: 'Video Generator use karne ke liye ₹99 Premium plan unlock karo.' }, { status: 402 });
    }

    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (prompt.length < 8) return NextResponse.json({ error: 'Video ke liye kam se kam 8 characters ka detailed prompt likho.' }, { status: 400 });
    if (prompt.length > 2500) return NextResponse.json({ error: 'Prompt 2500 characters se chhota rakho.' }, { status: 400 });

    const requestedSeconds = Number(body?.seconds);
    const seconds = Number.isFinite(requestedSeconds) ? Math.max(4, Math.min(12, Math.round(requestedSeconds))) : 5;
    const ratio = ['9:16', '16:9', '1:1'].includes(body?.aspectRatio) ? body.aspectRatio : '9:16';
    const created = await createAgnesVideo(prompt, seconds, ratio);
    return NextResponse.json({ videoId: created.videoId, status: created.status, model: created.model }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video generation start nahi ho payi.';
    const status = /configure nahi hai|AGNES_API_KEY/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
