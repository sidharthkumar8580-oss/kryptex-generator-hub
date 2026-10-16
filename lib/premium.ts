import { createHmac, timingSafeEqual } from 'crypto';

export const PREMIUM_COOKIE = 'kryptex_premium';
const SESSION_DAYS = 30;

function secret() {
  const value = process.env.PREMIUM_SESSION_SECRET;
  if (!value || value.length < 24) throw new Error('PREMIUM_SESSION_SECRET set karo (kam se kam 24 characters).');
  return value;
}
function sign(expires: string) {
  return createHmac('sha256', secret()).update(expires).digest('hex');
}
export function createPremiumCookieValue() {
  const expires = String(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return `${expires}.${sign(expires)}`;
}
export function isPremiumCookieValid(value?: string) {
  if (!value) return false;
  const [expires, signature, extra] = value.split('.');
  if (!expires || !signature || extra || !/^\d+$/.test(expires) || Number(expires) <= Date.now()) return false;
  try {
    const expected = sign(expires);
    const got = Buffer.from(signature, 'hex');
    const want = Buffer.from(expected, 'hex');
    return got.length === want.length && timingSafeEqual(got, want);
  } catch {
    return false;
  }
}
export const PREMIUM_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
