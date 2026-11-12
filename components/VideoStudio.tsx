'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type VideoStatus = { status: string; progress: number; url: string | null; error: string | null };
type FFmpegLike = {
  load: (options: { coreURL: string; wasmURL: string }) => Promise<void>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  exec: (args: string[]) => Promise<number>;
  on: (event: string, callback: (data: any) => void) => void;
  deleteFile: (name: string) => Promise<void>;
};

const proxyUrl = (url: string) => '/api/video/download?url=' + encodeURIComponent(url);

export default function VideoStudio() {
  const [premium, setPremium] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('');
  const [seconds, setSeconds] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [startAt, setStartAt] = useState(0);
  const [endAt, setEndAt] = useState(5);
  const [editBusy, setEditBusy] = useState(false);
  const [editProgress, setEditProgress] = useState('');
  const [editedUrl, setEditedUrl] = useState('');
  const [editorError, setEditorError] = useState('');
  const [duration, setDuration] = useState(0);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const ffmpegRef = useRef<FFmpegLike | null>(null);
  const previewUrlRef = useRef('');

  const videoDownloadUrl = useMemo(() => videoUrl ? proxyUrl(videoUrl) : '', [videoUrl]);

  async function checkPremium() {
    try {
      const response = await fetch('/api/video/access', { cache: 'no-store' });
      const data = await response.json();
      setPremium(response.ok && data.premium === true);
    } catch { setPremium(false); }
  }

  useEffect(() => {
    void checkPremium();
    const refresh = () => { void checkPremium(); };
    window.addEventListener('focus', refresh);
    window.addEventListener('kryptex-premium-updated', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('kryptex-premium-updated', refresh);
    };
  }, []);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  async function generateVideo() {
    if (prompt.trim().length < 8) { setError('Kam se kam 8 characters ka detailed prompt likho.'); return; }
    setBusy(true); setError(''); setVideoUrl(''); setEditedUrl(''); setProgress(0); setStatusText('Agnes se video job start ho rahi hai…');
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), seconds, aspectRatio })
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || 'Video generation start nahi ho payi.');
      setStatusText('Request queue mein hai. Video generate hone ka wait karo…');
      for (let attempt = 0; attempt < 120; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const poll = await fetch('/api/video/status?videoId=' + encodeURIComponent(created.videoId), { cache: 'no-store' });
        const data = await poll.json() as VideoStatus;
        if (!poll.ok) throw new Error(data.error || 'Video status check nahi ho paya.');
        setProgress(Math.max(0, Math.min(100, Number(data.progress) || 0)));
        setStatusText(data.status === 'queued' ? 'Agnes queue mein hai…' : 'Video generate ho rahi hai…');
        if (data.status === 'completed' && data.url) {
          setVideoUrl(data.url); setEndAt(seconds); setProgress(100); setStatusText('Video ready hai. Preview ya download karo.'); return;
        }
        if (['failed', 'error', 'cancelled'].includes(data.status)) throw new Error(data.error || 'Video generation fail ho gayi.');
      }
      setStatusText('Agnes job abhi process ho sakti hai. Kuch der baad dobara try karo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video request complete nahi ho payi.');
      setStatusText('');
    } finally { setBusy(false); }
  }

  async function loadEditor() {
    if (ffmpegRef.current) { setFfmpegReady(true); return ffmpegRef.current; }
    setEditBusy(true); setEditorError(''); setEditProgress('Video editor load ho raha hai. Pehli baar thoda time lag sakta hai…');
    try {
      const dynamicImport = new Function('url', 'return import(url)') as (url: string) => Promise<any>;
      const mod = await dynamicImport('https://esm.sh/@ffmpeg/ffmpeg@0.12.15');
      const util = await dynamicImport('https://esm.sh/@ffmpeg/util@0.12.2');
      const ffmpeg: FFmpegLike = new mod.FFmpeg();
      ffmpeg.on('progress', (event: any) => {
        const percent = Math.round((Number(event?.progress) || 0) * 100);
        setEditProgress('Editing… ' + percent + '%');
      });
      const coreJs = await util.toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js', 'text/javascript');
      const coreWasm = await util.toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm', 'application/wasm');
      await ffmpeg.load({ coreURL: coreJs, wasmURL: coreWasm });
      ffmpegRef.current = ffmpeg;
      setFfmpegReady(true);
      setEditProgress('Editor ready hai.');
      return ffmpeg;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Editor load nahi ho paya.';
      setEditorError('Browser editor load nahi hua: ' + message + '. Original video download kar sakte ho.');
      setEditProgress('');
      return null;
    } finally { setEditBusy(false); }
  }

  async function exportTrim() {
    if (!videoUrl || duration <= 0) return;
    const start = Math.max(0, Math.min(startAt, duration - 0.5));
    const end = Math.max(start + 0.5, Math.min(endAt, duration));
    if (end <= start) { setEditorError('End time, start time se bada hona chahiye.'); return; }
    setEditBusy(true); setEditorError(''); setEditedUrl(''); setEditProgress('Editor prepare ho raha hai…');
    try {
      const ffmpeg = await loadEditor();
      if (!ffmpeg) return;
      setEditProgress('Video download ho rahi hai…');
      const response = await fetch(videoDownloadUrl);
      if (!response.ok) throw new Error('Video file fetch nahi ho payi. Original download link try karo.');
      const blob = await response.blob();
      if (blob.size > 120 * 1024 * 1024) throw new Error('Phone browser par editing ke liye file 120 MB se chhoti honi chahiye.');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      await ffmpeg.writeFile('source.mp4', bytes);
      setEditProgress('Selected part export ho raha hai…');
      const exitCode = await ffmpeg.exec(['-ss', String(start), '-i', 'source.mp4', '-t', String(end - start), '-c', 'copy', '-movflags', '+faststart', 'edited.mp4']);
      if (exitCode !== 0) throw new Error('FFmpeg export complete nahi hua.');
      const output = await ffmpeg.readFile('edited.mp4');
      const outputBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
      const objectUrl = URL.createObjectURL(new Blob([outputBuffer], { type: 'video/mp4' }));
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = objectUrl;
      setEditedUrl(objectUrl);
      setEditProgress('Edited video ready hai. Download button dabao.');
      try { await ffmpeg.deleteFile('source.mp4'); await ffmpeg.deleteFile('edited.mp4'); } catch {}
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Video edit nahi ho payi.');
      setEditProgress('');
    } finally { setEditBusy(false); }
  }

  return (
    <main className="video-studio-page">
      <section className="video-studio-shell">
        <div className="studio-heading">
          <div><div className="eyebrow">AGNES AI · CREATOR WORKSPACE</div><h1>Video <span className="gradient-text">Studio.</span></h1><p>Prompt se video banao, generation status dekho, preview karo aur basic trim karke export karo.</p></div>
          <Link href="/#tools" className="studio-back">← All tools</Link>
        </div>

        {premium === false && <div className="studio-lock"><span>✦</span><div><strong>Premium access required</strong><p>Agnes video generation aur editor use karne ke liye ₹99 Premium plan unlock karo.</p><Link className="button-primary" href="/#pricing">Unlock Premium · ₹99 ↗</Link></div></div>}
        {premium === null && <div className="studio-info">Premium access check ho raha hai…</div>}

        <div className="studio-grid">
          <section className="studio-card">
            <div className="studio-card-title"><span className="studio-step">01</span><div><h2>Create video</h2><p>Apna scene aur output format set karo.</p></div></div>
            <label className="field-label" htmlFor="agnes-prompt">VIDEO PROMPT</label>
            <textarea id="agnes-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={2500} placeholder="Example: Cinematic vertical shot of a futuristic electric car driving through a neon-lit city at night, realistic camera movement, detailed reflections…" />
            <div className="studio-fields">
              <label><span className="field-label">DURATION</span><select value={seconds} onChange={(event) => setSeconds(Number(event.target.value))}><option value={5}>5 seconds</option><option value={8}>8 seconds</option><option value={10}>10 seconds</option><option value={12}>12 seconds</option></select></label>
              <label><span className="field-label">ASPECT RATIO</span><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}><option value="9:16">9:16 · Shorts</option><option value="16:9">16:9 · YouTube</option><option value="1:1">1:1 · Square</option></select></label>
            </div>
            <div className="studio-actions"><span>{prompt.length}/2500</span><button className="button-primary" type="button" disabled={!premium || busy || premium === null} onClick={generateVideo}>{busy ? <><i className="spinner" /> Generating…</> : '▶ Generate with Agnes'}</button></div>
            {statusText && <div className="studio-status" role="status"><div className="studio-status-top"><span>{statusText}</span><b>{progress}%</b></div><div className="studio-progress"><i style={{ width: progress + '%' }} /></div></div>}
            {error && <div className="error-box" role="alert">{error}</div>}
          </section>

          <section className="studio-card output-card">
            <div className="studio-card-title"><span className="studio-step">02</span><div><h2>Preview & download</h2><p>Generation complete hone par video yahan dikhegi.</p></div></div>
            {videoUrl ? <><video className="studio-video" controls playsInline src={videoDownloadUrl} onLoadedMetadata={(event) => { const d = event.currentTarget.duration; if (Number.isFinite(d)) { setDuration(d); setEndAt(d); } }} /><div className="studio-download-row"><a className="button-primary" href={videoDownloadUrl} download="kryptex-agnes-video.mp4">↓ Download original</a><a className="button-secondary" href={videoUrl} target="_blank" rel="noreferrer">Open source ↗</a></div></> : <div className="video-placeholder"><span>▶</span><strong>Your video will appear here</strong><small>Generate video to see preview and editing tools.</small></div>}
          </section>
        </div>

        {videoUrl && <section className="studio-card editor-card">
          <div className="studio-card-title"><span className="studio-step">03</span><div><h2>Quick video editor</h2><p>Video ka start aur end select karke short clip export karo. Original file unchanged rahegi.</p></div></div>
          <div className="editor-controls">
            <label><span className="field-label">START (SECONDS)</span><input type="number" min="0" max={duration || seconds} step="0.5" value={startAt} onChange={(event) => setStartAt(Number(event.target.value))} /></label>
            <label><span className="field-label">END (SECONDS)</span><input type="number" min="0.5" max={duration || seconds} step="0.5" value={endAt} onChange={(event) => setEndAt(Number(event.target.value))} /></label>
            <button className="button-primary" type="button" disabled={editBusy || !premium} onClick={exportTrim}>{editBusy ? 'Processing…' : '✂ Trim & export'}</button>
          </div>
          <p className="editor-hint">Note: Browser mein FFmpeg pehli baar download hota hai aur phone par heavy ho sakta hai. Trim keyframe ke paas snap ho sakta hai; 120 MB se badi files editor mein process nahi hongi.</p>
          {editProgress && <p className="status-note" role="status">{editProgress}</p>}
          {editorError && <div className="error-box" role="alert">{editorError}</div>}
          {editedUrl && <div className="edited-result"><video controls playsInline src={editedUrl} /><a className="button-primary" href={editedUrl} download="kryptex-edited-video.mp4">↓ Download edited video</a></div>}
          {!ffmpegReady && <small className="editor-footnote">Editor engine on-demand load hoga, isliye bina edit kiye extra download nahi hoga.</small>}
        </section>}
      </section>
    </main>
  );
}
