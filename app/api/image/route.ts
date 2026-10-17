import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function generateWithHF(prompt: string) {
  const token = process.env.HF_TOKEN?.trim();
  if (!token) throw new Error('HF_TOKEN missing');

  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generateWithAgnes(prompt: string) {
  const key = process.env.AGNES_API_KEY?.trim();
  if (!key) throw new Error('AGNES_API_KEY missing');

  const response = await fetch('https://apihub.agnes-ai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.AGNES_IMAGE_MODEL || 'agnes-image-2.1-flash',
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Agnes HTTP ${response.status}`);
  }

  const data = await response.json();

  const url =
    data?.data?.[0]?.url ||
    data?.data?.[0]?.image_url ||
    data?.url;

  if (!url) {
    throw new Error('Agnes returned no image URL');
  }

  return url;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body.prompt || body.message || '').trim();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Image prompt is required' },
        { status: 400 }
      );
    }

    try {
      const image = await generateWithHF(prompt);
      return NextResponse.json({ image, provider: 'HUGGINGFACE' });
    } catch (hfError) {
      console.error(
        'Hugging Face image failed:',
        hfError instanceof Error ? hfError.message : 'unknown error'
      );
    }

    const image = await generateWithAgnes(prompt);
    return NextResponse.json({ image, provider: 'AGNES' });
  } catch (error) {
    console.error('Image API error:', error);
    return NextResponse.json(
      { error: 'Image generation failed' },
      { status: 500 }
    );
  }
}
