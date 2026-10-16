import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createAgnesVideo } from '@/lib/agnes';
import { isPremiumCookieValid, PREMIUM_COOKIE } from '@/lib/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_COUPON = "KRYPTEX7FREE";

export async function POST(request: NextRequest) {
  try {
    const { prompt, seconds, aspectRatio, coupon } = await request.json();

    const hasValidCoupon = typeof coupon === 'string' && coupon.trim().toUpperCase() === VALID_COUPON;
    const hasPremium = isPremiumCookieValid(cookies().get(PREMIUM_COOKIE)?.value);

    // Agar coupon sahi hai to premium check skip karo
    if (!hasValidCoupon && !hasPremium) {
      return NextResponse.json({ error: 'Video Generator ₹99 Premium plan mein unlock hota hai. Pehle plan purchase karo. Ya coupon KRYPTEX7FREE use karo.' }, { status: 402 });
    }

    if (typeof prompt !== 'string' || prompt.trim().length < 8) return NextResponse.json({ error: 'Video ke liye detailed prompt likho.' }, { status: 400 });
    if (prompt.length > 2500) return NextResponse.json({ error: 'Prompt 2500 characters se chhota rakho.' }, { status: 400 });
    const created = await createAgnesVideo(prompt, Number(seconds) || 5, ['9:16', '16:9', '1:1'].includes(aspectRatio) ? aspectRatio : '9:16');
    return NextResponse.json({ videoId: created.videoId, status: created.status, model: created.model });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video generation start nahi ho payi.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
