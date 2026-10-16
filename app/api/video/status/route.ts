import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAgnesVideoStatus } from '@/lib/agnes';
import { isPremiumCookieValid, PREMIUM_COOKIE } from '@/lib/premium';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const VALID_COUPON = "KRYPTEX7FREE";
export async function GET(request: NextRequest) {
  const coupon = request.nextUrl.searchParams.get('coupon') || '';
  const hasValidCoupon = coupon.trim().toUpperCase() === VALID_COUPON;
  const hasPremium = isPremiumCookieValid(cookies().get(PREMIUM_COOKIE)?.value);
  if (!hasValidCoupon && !hasPremium) return NextResponse.json({ error: 'Premium plan required.' }, { status: 402 });
  const videoId = request.nextUrl.searchParams.get('videoId') || '';
  if (!videoId || videoId.length > 200 || !/^[a-zA-Z0-9._:-]+$/.test(videoId)) return NextResponse.json({ error: 'Invalid video ID.' }, { status: 400 });
  try {
    const payload = await getAgnesVideoStatus(videoId);
    return NextResponse.json({
      status: payload.status || 'in_progress',
      progress: typeof payload.progress === 'number' ? payload.progress : 0,
      url: typeof payload.url === 'string' ? payload.url : null,
      error: typeof payload.error === 'string' ? payload.error : payload.error ? JSON.stringify(payload.error) : null
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video status check nahi ho paya.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
