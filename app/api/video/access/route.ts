import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isPremiumCookieValid, PREMIUM_COOKIE } from '@/lib/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const active = isPremiumCookieValid(cookies().get(PREMIUM_COOKIE)?.value);
  return NextResponse.json({ premium: active }, { headers: { 'Cache-Control': 'no-store' } });
}
