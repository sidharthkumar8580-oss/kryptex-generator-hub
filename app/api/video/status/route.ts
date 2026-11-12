import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAgnesVideoStatus } from '@/lib/agnes';
import { isPremiumCookieValid, PREMIUM_COOKIE } from '@/lib/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isPremiumCookieValid(cookies().get(PREMIUM_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Premium plan required.' }, { status: 402 });
  }

  const videoId = request.nextUrl.searchParams.get('videoId') || '';
  if (!videoId || videoId.length > 200 || !/^[a-zA-Z0-9._:-]+$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID.' }, { status: 400 });
  }

  try {
    const payload = await getAgnesVideoStatus(videoId);
    const status = String(payload.status || 'in_progress').toLowerCase();
    const url = typeof payload.url === 'string' ? payload.url : null;
    const error = typeof payload.error === 'string' ? payload.error : payload.error ? JSON.stringify(payload.error) : null;
    return NextResponse.json({
      status,
      progress: typeof payload.progress === 'number' ? Math.max(0, Math.min(100, payload.progress)) : (status === 'completed' ? 100 : 0),
      url,
      error
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video status check nahi ho paya.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
