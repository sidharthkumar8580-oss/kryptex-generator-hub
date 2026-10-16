import { NextRequest, NextResponse } from 'next/server';
import { getChatReply } from '@/lib/pollinations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const instructions: Record<string, string> = {
  script: 'Write an original Hindi/Hinglish YouTube Shorts script for a tech, AI, cyber safety, science, or What-if educational channel. Include a strong opening hook, curious middle, and satisfying ending. Aim for 25–40 seconds. Output only usable script with simple spoken Hindi.',
  hook: 'Create 10 punchy Hindi/Hinglish opening hooks for YouTube Shorts about the given topic. Each must spark curiosity without false claims. Number them.',
  title: 'Generate 12 clickable but honest YouTube Shorts titles in Hindi/Hinglish for the topic. Keep most titles concise, avoid fake claims, and do not use excessive emojis.',
  hashtags: 'Generate 12 relevant YouTube Shorts hashtags and 8 searchable keywords for the topic. Keep them relevant and avoid generic spam.',
  caption: 'Write 5 short, engaging Hindi/Hinglish captions for a tech educational YouTube Short. Add a natural call-to-action in only one or two options.',
  shayari: 'Write original Hindi/Hinglish shayari based on the requested feeling or theme. Give 5 short options, do not quote existing songs or poems.',
  story: 'Create an original, engaging 30–45 second Hindi/Hinglish micro-story based on the topic. Use a fast hook, clear progression, and memorable ending.',
  bio: 'Write 5 clean and professional Hindi/Hinglish YouTube channel bio/about descriptions for the channel Ankit Kryptex, focused on AI, technology, cybersecurity awareness, science and digital facts. Avoid promising results.',
  thumbnail: 'Create 5 detailed English image-generation prompts for a 9:16 YouTube Shorts thumbnail about the given topic. Include visual subject, lighting, composition, color contrast, and space for short Hindi title text; do not ask the image model to render legible text.',
};

export async function POST(request: NextRequest) {
  try {
    const { tool, topic } = await request.json();
    if (typeof tool !== 'string' || !instructions[tool]) return NextResponse.json({ error: 'Unknown generator tool.' }, { status: 400 });
    if (typeof topic !== 'string' || !topic.trim()) return NextResponse.json({ error: 'Topic likho, tab generator kaam karega.' }, { status: 400 });
    if (topic.length > 1600) return NextResponse.json({ error: 'Topic 1600 characters se chhota rakho.' }, { status: 400 });
    const result = await getChatReply([
      { role: 'system', content: `You are the content assistant for Ankit Kryptex. Follow the task exactly. Return clean plain text, no preamble. ${instructions[tool]}` },
      { role: 'user', content: topic.trim() }
    ]);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generator service abhi available nahi hai.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
