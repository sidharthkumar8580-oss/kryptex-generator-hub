import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Payment abhi configure nahi hai. Razorpay account aur server env keys set karne ke baad ₹99 plan active hoga.' }, { status: 503 });
  }
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 9900, currency: 'INR', receipt: `kryptex_${Date.now()}`, notes: { plan: 'Kryptex Generator Hub Premium' } }),
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: payload?.error?.description || 'Payment order create nahi ho paya.' }, { status: 502 });
    return NextResponse.json({ orderId: payload.id, amount: payload.amount, currency: payload.currency, keyId });
  } catch {
    return NextResponse.json({ error: 'Payment service se connection nahi ho paya.' }, { status: 502 });
  }
}
