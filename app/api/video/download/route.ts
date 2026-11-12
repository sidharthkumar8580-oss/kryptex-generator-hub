import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_DOMAINS = ['platform-outputs.agnes-ai.space', 'agnes-ai.space', 'agnes-ai.com'];

function isTrustedHost(hostname: string) {
  return ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith('.' + domain));
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw || raw.length > 2048) return NextResponse.json({ error: 'Video URL missing hai.' }, { status: 400 });

  let target: URL;
  try { target = new URL(raw); } catch { return NextResponse.json({ error: 'Invalid video URL.' }, { status: 400 }); }
  if (target.protocol !== 'https:' || !isTrustedHost(target.hostname) || target.username || target.password) {
    return NextResponse.json({ error: 'Video host allowed nahi hai.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), { signal: AbortSignal.timeout(60_000), cache: 'no-store' });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: 'Video file fetch nahi ho payi.' }, { status: 502 });
    const length = Number(upstream.headers.get('content-length') || 0);
    if (length > 250 * 1024 * 1024) return NextResponse.json({ error: 'Video file 250 MB se badi hai.' }, { status: 413 });
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'video/mp4',
        'Content-Disposition': 'inline; filename="agnes-video.mp4"',
        'Cache-Control': 'private, no-store',
        ...(length ? { 'Content-Length': String(length) } : {})
      }
    });
  } catch {
    return NextResponse.json({ error: 'Video file load nahi ho payi. Direct video link se download try karo.' }, { status: 502 });
  }
}
