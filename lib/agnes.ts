const AGNES_BASE = 'https://apihub.agnes-ai.com';
async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }
function extractErrorMessage(payload: any, fallback: string){
  if(!payload) return fallback;
  if(typeof payload.message === 'string') return payload.message;
  if(typeof payload.error === 'string') return payload.error;
  if(payload.error && typeof payload.error === 'object'){
    return payload.error.message || payload.error.msg || JSON.stringify(payload.error);
  }
  if(typeof payload.msg === 'string') return payload.msg;
  return fallback;
}
export async function createAgnesVideo(prompt: string, seconds = 5, aspectRatio = '9:16') {
  const apiKey = process.env.AGNES_API_KEY?.trim();
  if (!apiKey) throw new Error('Video API abhi configure nahi hai.');
  const model = process.env.AGNES_VIDEO_MODEL || 'agnes-video-2.5-flash';
  let lastError = '';
  for(let attempt=0; attempt<3; attempt++){
    const response = await fetch(`${AGNES_BASE}/v1/videos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, prompt: prompt.trim().slice(0, 2500), mode: 'text',
        seconds: String(Math.max(4, Math.min(12, seconds))), size: '720P', aspect_ratio: aspectRatio, n: 1
      }),
      signal: AbortSignal.timeout(45_000), cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({})) as any;
    if(response.ok){
      const videoId = payload.video_id || payload.id || payload.task_id;
      if (!videoId) throw new Error(payload.message || 'Agnes ne video job ID return nahi kiya.');
      return { videoId: String(videoId), model, status: payload.status || 'queued', raw: payload };
    }
    const code = payload?.code || '';
    lastError = extractErrorMessage(payload, `Agnes API request failed (${response.status}).`);
    if(code === 'video_queue_full' || response.status === 503){
      if(attempt < 2) { await sleep(6000 * (attempt+1)); continue; }
      throw new Error('Agnes ka server abhi busy hai (queue full). 2-3 min baad fir se try karo - KRYPTEX7FREE code se.');
    }
    throw new Error(lastError);
  }
  throw new Error(lastError);
}
export async function getAgnesVideoStatus(videoId: string) {
  const apiKey = process.env.AGNES_API_KEY?.trim();
  if (!apiKey) throw new Error('Video API abhi configure nahi hai.');
  const model = process.env.AGNES_VIDEO_MODEL || 'agnes-video-2.5-flash';
  const url = `${AGNES_BASE}/agnesapi?video_id=${encodeURIComponent(videoId)}&model_name=${encodeURIComponent(model)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(25_000), cache: 'no-store'
  });
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok) throw new Error(extractErrorMessage(payload, `Agnes status check failed (${response.status}).`));
  return payload;
}
