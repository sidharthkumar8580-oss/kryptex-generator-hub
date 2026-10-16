export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const LEGACY_TEXT_URL = 'https://text.pollinations.ai/';
const MODERN_BASE_URL = 'https://gen.pollinations.ai';

export async function getChatReply(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.POLLINATIONS_API_KEY?.trim();
  const model = process.env.POLLINATIONS_TEXT_MODEL || 'openai';
  const safeMessages = messages.slice(-12).map(({ role, content }) => ({
    role,
    content: String(content).slice(0, 6000)
  }));

  let response: Response;
  if (apiKey) {
    response = await fetch(`${MODERN_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: safeMessages, stream: false }),
      signal: AbortSignal.timeout(45_000),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(await apiError(response, 'Pollinations text service'));
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('AI ne khaali jawab diya. Dobara try karo.');
    return content.trim();
  }

  // Legacy no-key endpoint, matching the URL style requested in the project brief.
  response = await fetch(LEGACY_TEXT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/plain' },
    body: JSON.stringify({ messages: safeMessages, model, seed: Math.floor(Math.random() * 1_000_000) }),
    signal: AbortSignal.timeout(45_000),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(await apiError(response, 'Pollinations text service'));
  const text = (await response.text()).trim();
  if (!text) throw new Error('AI ne khaali jawab diya. Dobara try karo.');
  return text;
}

export function getImageUrl(prompt: string): string {
  const cleaned = prompt.trim().slice(0, 1200);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleaned)}?nologo=true&width=1024&height=1024`;
}

export async function getImageResult(prompt: string): Promise<{ url?: string; dataUrl?: string }> {
  const apiKey = process.env.POLLINATIONS_API_KEY?.trim();
  const imagePrompt = prompt.trim().slice(0, 1200);
  if (!imagePrompt) throw new Error('Image prompt likho.');

  // If a modern Pollinations key is configured, proxy the image server-side so the key is never exposed.
  if (apiKey) {
    const model = process.env.POLLINATIONS_IMAGE_MODEL || 'flux';
    const url = `${MODERN_BASE_URL}/image/${encodeURIComponent(imagePrompt)}?model=${encodeURIComponent(model)}&width=768&height=768&nologo=true`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(90_000),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(await apiError(response, 'Pollinations image service'));
    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) throw new Error('Image service ne expected image return nahi ki.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength > 5_000_000) throw new Error('Image bahut badi hai. Dobara try karo.');
    return { dataUrl: `data:${contentType};base64,${bytes.toString('base64')}` };
  }
  return { url: getImageUrl(imagePrompt) };
}

async function apiError(response: Response, service: string): Promise<string> {
  const detail = (await response.text().catch(() => '')).slice(0, 300);
  if (response.status === 401 || response.status === 403) {
    return `${service} ne request reject ki. Agar legacy no-key access available nahi hai, server environment mein valid Pollinations API key configure karo.`;
  }
  return `${service} error (${response.status}). ${detail || 'Thodi der baad try karo.'}`;
}
