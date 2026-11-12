const configuredBase = process.env.AGNES_BASE_URL?.trim() || process.env.AGNES_API_BASE?.trim() || 'https://apihub.agnes-ai.com';
const AGNES_BASE = configuredBase.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function messageFrom(payload: any, fallback: string) {
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.error?.message === 'string') return payload.error.message;
  if (typeof payload?.msg === 'string') return payload.msg;
  return fallback;
}

function getApiKey() {
  const key = process.env.AGNES_API_KEY?.trim();
  if (!key) throw new Error('Video API configure nahi hai. Netlify environment variables mein AGNES_API_KEY set karo.');
  return key;
}

export async function createAgnesVideo(prompt: string, seconds = 5, aspectRatio = '9:16') {
  const apiKey = getApiKey();
  const model = process.env.AGNES_VIDEO_MODEL?.trim() || 'agnes-video-2.5-flash';
  const duration = Math.max(4, Math.min(12, Math.round(seconds)));
  const retryable = new Set([408, 429, 500, 502, 503, 504, 520, 522, 524]);
  let lastError = 'Agnes video request failed.';

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(AGNES_BASE + '/v1/videos', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: prompt.trim().slice(0, 2500),
          mode: 'text',
          seconds: String(duration),
          size: '720P',
          aspect_ratio: aspectRatio,
          n: 1
        }),
        signal: AbortSignal.timeout(60_000),
        cache: 'no-store'
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Agnes service se connection nahi ho paya.';
      if (attempt < 2) { await sleep(2000 * (attempt + 1)); continue; }
      throw new Error(lastError);
    }

    const payload = await response.json().catch(() => ({})) as any;
    if (response.ok) {
      const videoId = payload.video_id;
      if (!videoId || typeof videoId !== 'string') {
        throw new Error('Agnes response mein video_id nahi mila. Agnes API response format check karo.');
      }
      return { videoId, model, status: String(payload.status || 'queued') };
    }

    lastError = messageFrom(payload, 'Agnes API error (' + response.status + ').');
    if (payload?.code === 'video_queue_full' || /video.?queue.?full|queue is full|queue full/i.test(lastError)) {
      throw new Error('Agnes ka free video queue abhi full hai. Request accept nahi hui, isliye video generate nahi hogi. 1–2 minute baad ek baar dobara try karo.');
    }
    if (retryable.has(response.status) && attempt < 2) {
      await sleep(Math.min(12000, 2000 * Math.pow(2, attempt)));
      continue;
    }
    if (payload?.code === 'video_queue_full') {
      throw new Error('Agnes video queue abhi full hai. Kuch der baad dobara try karo.');
    }
    throw new Error(lastError);
  }
  throw new Error(lastError);
}

export async function getAgnesVideoStatus(videoId: string) {
  const apiKey = getApiKey();
  const model = process.env.AGNES_VIDEO_MODEL?.trim() || 'agnes-video-2.5-flash';
  const url = AGNES_BASE + '/agnesapi?video_id=' + encodeURIComponent(videoId) + '&model_name=' + encodeURIComponent(model);
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + apiKey },
    signal: AbortSignal.timeout(30_000),
    cache: 'no-store'
  });
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok) throw new Error(messageFrom(payload, 'Agnes status check failed (' + response.status + ').'));
  return payload;
}
