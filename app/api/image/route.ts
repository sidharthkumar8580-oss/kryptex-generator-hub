import { NextRequest, NextResponse } from 'next/server';
import { getImageResult } from '@/lib/pollinations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Image ke liye prompt likho.' }, { status: 400 });
    }
    if (prompt.length > 1200) return NextResponse.json({ error: 'Prompt 1200 characters se chhota rakho.' }, { status: 400 });
    const image = await getImageResult(prompt);
    return NextResponse.json(image, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generate nahi ho payi.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
