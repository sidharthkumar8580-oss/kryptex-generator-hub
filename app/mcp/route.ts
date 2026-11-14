import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { runChat } from '@/lib/chat-provider';
import { createAgnesVideo, getAgnesVideoStatus } from '@/lib/agnes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = 'https://ankitkryptex.netlify.app';

const creatorPrompts: Record<string, string> = {
  script: 'Write a compelling YouTube Shorts script in natural Hindi/Hinglish. Start with a strong hook, explain clearly, and end with a memorable payoff. Keep it concise and ready for voice-over.',
  hook: 'Generate 10 distinct, attention-grabbing opening hooks in Hindi/Hinglish. Avoid generic questions and make each hook curiosity-driven.',
  title: 'Generate 10 clickable but accurate YouTube titles in Hindi/Hinglish. Avoid misleading clickbait.',
  hashtags: 'Create a useful YouTube SEO pack: a short description, relevant search keywords, and focused hashtags. Avoid irrelevant or spammy tags.',
  caption: 'Write 5 engaging short social-media captions in natural Hindi/Hinglish, with a few relevant hashtags.',
  shayari: 'Write original Hindi/Hinglish shayari matching the requested mood. Do not quote existing songs or famous poems.',
  story: 'Write an original, engaging short story in Hindi/Hinglish with a fast opening, clear progression, and satisfying ending.',
  thumbnail: 'Create a detailed English image-generation prompt for a high-contrast, cinematic YouTube thumbnail. Do not claim to create the image.'
};

const pages = [
  { id: 'home', name: 'Kryptex Home', url: SITE + '/', description: 'Main dashboard and creator tools' },
  { id: 'ai', name: 'Ankit Kryptex AI', url: SITE + '/ai', description: 'AI chat and assistant interface' },
  { id: 'video-studio', name: 'Video Studio', url: SITE + '/video-studio', description: 'AI video workspace and job status UI' },
  { id: 'editor', name: 'Media Editor', url: SITE + '/editor', description: 'Browser-based photo/video editing workspace' },
  { id: 'tools', name: 'Creator Tools', url: SITE + '/#tools', description: 'Eight text/content generators plus image and video tools' }
];

const tools = [
  {
    name: 'kryptex_overview',
    description: 'Read-only overview of the complete Ankit Kryptex website, its pages, and available capabilities.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnlyHint: true
  },
  {
    name: 'kryptex_list_features',
    description: 'List the pages and creator tools currently present in the Kryptex website repository.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    readOnlyHint: true
  },
  {
    name: 'kryptex_open_page',
    description: 'Get the official URL and description for a Kryptex page. This returns a link; it does not control the user’s browser.',
    inputSchema: {
      type: 'object',
      properties: { page: { type: 'string', enum: ['home', 'ai', 'video-studio', 'editor', 'tools'] } },
      required: ['page'],
      additionalProperties: false
    },
    readOnlyHint: true
  },
  {
    name: 'kryptex_run_creator_tool',
    description: 'Run any of the eight text/content generators already available on Kryptex: script, hook, title, hashtags, caption, shayari, story, or thumbnail prompt. Requires the private MCP access token.',
    inputSchema: {
      type: 'object',
      properties: {
        tool: { type: 'string', enum: Object.keys(creatorPrompts) },
        topic: { type: 'string', minLength: 1, maxLength: 2500 }
      },
      required: ['tool', 'topic'],
      additionalProperties: false
    },
    readOnlyHint: false
  },
  {
    name: 'kryptex_chat',
    description: 'Send a message to the same AI chat provider used by Ankit Kryptex AI. Requires the private MCP access token.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', minLength: 1, maxLength: 6000 } },
      required: ['message'],
      additionalProperties: false
    },
    readOnlyHint: false
  },
  {
    name: 'kryptex_generate_image',
    description: 'Use Kryptex’s configured image-generation backend. Provider availability and quotas apply. Requires the private MCP access token.',
    inputSchema: {
      type: 'object',
      properties: { prompt: { type: 'string', minLength: 1, maxLength: 2000 } },
      required: ['prompt'],
      additionalProperties: false
    },
    readOnlyHint: false
  },
  {
    name: 'kryptex_create_video',
    description: 'Start a video-generation job using the website’s configured Agnes provider. This may consume provider credits. Requires the private MCP access token.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', minLength: 8, maxLength: 2500 },
        seconds: { type: 'integer', minimum: 4, maximum: 12 },
        aspectRatio: { type: 'string', enum: ['9:16', '16:9', '1:1'] }
      },
      required: ['prompt'],
      additionalProperties: false
    },
    readOnlyHint: false
  },
  {
    name: 'kryptex_check_video',
    description: 'Check the status of a video job created through Kryptex. Requires the private MCP access token.',
    inputSchema: {
      type: 'object',
      properties: { videoId: { type: 'string', minLength: 1, maxLength: 200 } },
      required: ['videoId'],
      additionalProperties: false
    },
    readOnlyHint: true
  }
];

function authorized(request: NextRequest) {
  const expected = process.env.MCP_BEARER_TOKEN?.trim();
  if (!expected) return false;
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const actualBuffer = Buffer.from(match[1]);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function resultText(value: unknown) {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] };
}

function failure(message: string, isError = true) {
  return { content: [{ type: 'text', text: message }], isError };
}

async function callTool(request: NextRequest, name: string, args: Record<string, unknown>) {
  if (name === 'kryptex_overview') {
    return resultText({
      name: 'Ankit Kryptex',
      website: SITE,
      summary: 'A unified creative workspace for AI chat, creator content, image and video generation, and browser-based media editing.',
      pages,
      note: 'The connected website exposes its current capabilities through this MCP server. Browser-only editing controls remain available by opening the Media Editor page.'
    });
  }

  if (name === 'kryptex_list_features') {
    return resultText({
      pages,
      creatorTools: [
        'Shorts Script', 'Hook Generator', 'Title Generator', 'Hashtag & SEO',
        'Caption Writer', 'Shayari Maker', 'Story Maker', 'Thumbnail Prompt',
        'AI Image Creator', 'AI Video Generator'
      ],
      additionalFeatures: ['Ankit Kryptex AI chat', 'Voice Assistant interface', 'Browser-based Media Editor', 'Video Studio'],
      games: 'No game routes or game modules were found in the currently connected GitHub project.'
    });
  }

  if (name === 'kryptex_open_page') {
    const page = pages.find((item) => item.id === args.page);
    return page ? resultText(page) : failure('Unknown Kryptex page.');
  }

  const needsAuth = !['kryptex_overview', 'kryptex_list_features', 'kryptex_open_page'].includes(name);
  if (needsAuth && !authorized(request)) {
    return failure('This Kryptex action is locked until the site owner adds MCP_BEARER_TOKEN as a secret Netlify environment variable and sends its bearer token with the request.');
  }

  if (name === 'kryptex_run_creator_tool') {
    const tool = String(args.tool || '');
    const topic = String(args.topic || '').trim();
    if (!creatorPrompts[tool]) return failure('Unsupported creator tool.');
    if (!topic || topic.length > 2500) return failure('Topic must contain 1–2500 characters.');
    const response = await runChat({
      messages: [
        { role: 'system', content: creatorPrompts[tool] + ' Output should be well formatted and directly usable. Follow the language requested by the user; default to Hindi/Hinglish.' },
        { role: 'user', content: topic }
      ]
    });
    return resultText({ result: response.reply, provider: response.provider });
  }

  if (name === 'kryptex_chat') {
    const message = String(args.message || '').trim();
    if (!message || message.length > 6000) return failure('Message must contain 1–6000 characters.');
    const response = await runChat({ message });
    return resultText(response);
  }

  if (name === 'kryptex_generate_image') {
    const prompt = String(args.prompt || '').trim();
    if (!prompt || prompt.length > 2000) return failure('Image prompt must contain 1–2000 characters.');
    const response = await fetch(new URL('/api/image', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return failure(String(data.error || 'Kryptex image generation failed.'));
    return resultText({ provider: data.provider, image: data.image });
  }

  if (name === 'kryptex_create_video') {
    const prompt = String(args.prompt || '').trim();
    if (prompt.length < 8 || prompt.length > 2500) return failure('Video prompt must contain 8–2500 characters.');
    const seconds = Number.isInteger(args.seconds) ? Math.max(4, Math.min(12, Number(args.seconds))) : 5;
    const ratio = ['9:16', '16:9', '1:1'].includes(String(args.aspectRatio)) ? String(args.aspectRatio) : '9:16';
    const job = await createAgnesVideo(prompt, seconds, ratio);
    return resultText({ ...job, statusUrl: SITE + '/api/video/status?videoId=' + encodeURIComponent(job.videoId) });
  }

  if (name === 'kryptex_check_video') {
    const videoId = String(args.videoId || '');
    if (!videoId || videoId.length > 200 || !/^[a-zA-Z0-9._:-]+$/.test(videoId)) return failure('Invalid video ID.');
    const status = await getAgnesVideoStatus(videoId);
    return resultText(status);
  }

  return failure('Unknown Kryptex tool: ' + name);
}

export async function POST(request: NextRequest) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: invalid JSON' } }, { status: 400 });
  }

  const id = payload?.id ?? null;
  const method = payload?.method;
  const params = payload?.params ?? {};

  if (typeof method !== 'string') {
    return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid JSON-RPC request' } }, { status: 400 });
  }

  if (method.startsWith('notifications/')) return new Response(null, { status: 202 });

  try {
    if (method === 'initialize') {
      const requested = params?.protocolVersion;
      const supported = ['2025-06-18', '2025-03-26', '2024-11-05'];
      const protocolVersion = supported.includes(requested) ? requested : '2025-03-26';
      return NextResponse.json({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'ankit-kryptex', version: '1.0.0' },
          instructions: 'Kryptex exposes the current Ankit Kryptex website pages and supported creator tools. Read-only discovery is public; AI generation actions require a bearer token.'
        }
      });
    }

    if (method === 'ping') return NextResponse.json({ jsonrpc: '2.0', id, result: {} });

    if (method === 'tools/list') {
      return NextResponse.json({ jsonrpc: '2.0', id, result: { tools } });
    }

    if (method === 'tools/call') {
      const name = String(params?.name || '');
      const args = params?.arguments && typeof params.arguments === 'object' ? params.arguments : {};
      const result = await callTool(request, name, args);
      return NextResponse.json({ jsonrpc: '2.0', id, result });
    }

    return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kryptex MCP request failed.';
    return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32000, message } }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ name: 'Ankit Kryptex MCP', endpoint: SITE + '/mcp', transport: 'Streamable HTTP', status: 'online-route' });
}
