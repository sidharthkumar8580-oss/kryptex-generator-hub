import { NextRequest, NextResponse } from 'next/server';
import { runChat } from '@/lib/chat-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const toolPrompts: Record<string, string> = {
  script: 'Write a compelling YouTube Shorts script in natural Hindi/Hinglish. Start with a strong hook, explain clearly, and end with a memorable payoff. Keep it concise and ready for voice-over.',
  hook: 'Generate 10 distinct, attention-grabbing opening hooks in Hindi/Hinglish. Avoid generic questions and make each hook curiosity-driven.',
  title: 'Generate 10 clickable but accurate YouTube titles in Hindi/Hinglish. Avoid misleading clickbait.',
  hashtags: 'Create a useful YouTube SEO pack: a short description, relevant search keywords, and focused hashtags. Avoid irrelevant or spammy tags.',
  caption: 'Write 5 engaging short social-media captions in natural Hindi/Hinglish, with a few relevant hashtags.',
  shayari: 'Write original Hindi/Hinglish shayari matching the requested mood. Do not quote existing songs or famous poems.',
  story: 'Write an original, engaging short story in Hindi/Hinglish with a fast opening, clear progression, and satisfying ending.',
  thumbnail: 'Create a detailed English image-generation prompt for a high-contrast, cinematic YouTube thumbnail. Do not claim to create the image.'
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tool = typeof body?.tool === 'string' ? body.tool : '';
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';

    if (!toolPrompts[tool]) {
      return NextResponse.json({ error: 'Selected generator valid nahi hai.' }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ error: 'Pehle topic ya idea likho.' }, { status: 400 });
    }
    if (topic.length > 2500) {
      return NextResponse.json({ error: 'Topic 2500 characters se chhota rakho.' }, { status: 400 });
    }

    const response = await runChat({
      messages: [
        { role: 'system', content: toolPrompts[tool] + ' Output should be well formatted and directly usable. Follow the language requested by the user; default to Hindi/Hinglish.' },
        { role: 'user', content: topic }
      ]
    });

    return NextResponse.json({ result: response.reply, provider: response.provider }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Generate API error:', error);
    const message = error instanceof Error ? error.message : 'AI generation request failed';
    return NextResponse.json(
      { error: message || 'AI generation request failed' },
      { status: 502 }
    );
  }
}
