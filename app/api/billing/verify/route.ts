import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createPremiumCookieValue, PREMIUM_COOKIE, PREMIUM_MAX_AGE } from '@/lib/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) return NextResponse.json({ error: 'Payment verification configure nahi hai.' }, { status: 503 });
  try {
    const body = await request.json();
    const orderId = String(body?.razorpay_order_id || '');
    const paymentId = String(body?.razorpay_payment_id || '');
    const signature = String(body?.razorpay_signature || '');
    if (!orderId || !paymentId || !signature || orderId.length > 100 || paymentId.length > 100) {
      return NextResponse.json({ error: 'Payment verification details missing hain.' }, { status: 400 });
    }
    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const suppliedBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      return NextResponse.json({ error: 'Payment signature verify nahi hui.' }, { status: 400 });
    }
    let value: string;
    try { value = createPremiumCookieValue(); }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Premium session secret missing.';
      return NextResponse.json({ error: message }, { status: 503 });
    }
    const response = NextResponse.json({ ok: true, message: 'Premium plan active ho gaya!' });
    response.cookies.set(PREMIUM_COOKIE, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: PREMIUM_MAX_AGE
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 });
  }
}
