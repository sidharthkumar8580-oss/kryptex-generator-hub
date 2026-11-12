'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Tool = { id: string; icon: string; name: string; category: string; detail: string; example: string; premium?: boolean };
const tools: Tool[] = [
  { id: 'script', icon: '▤', name: 'Shorts Script', category: 'VIDEO CONTENT', detail: 'Hook se ending tak Hindi script', example: 'Quantum computer kaise kaam karta hai?' },
  { id: 'hook', icon: '↗', name: 'Hook Generator', category: 'GROWTH', detail: 'Scroll rokne wale opening hooks', example: 'AI future mein jobs ko kaise badlega?' },
  { id: 'title', icon: 'T', name: 'Title Generator', category: 'YOUTUBE SEO', detail: 'Clickable, relevant video titles', example: 'Wi-Fi signals aur radio waves' },
  { id: 'hashtags', icon: '#', name: 'Hashtag & SEO', category: 'YOUTUBE SEO', detail: 'Relevant hashtags aur keywords', example: 'Cybersecurity facts for beginners' },
  { id: 'caption', icon: '✎', name: 'Caption Writer', category: 'SOCIAL', detail: 'Short-form social captions', example: 'AI ki ek surprising fact video' },
  { id: 'shayari', icon: '❝', name: 'Shayari Maker', category: 'WRITING', detail: 'Original Hindi/Hinglish lines', example: 'Motivation aur self-belief' },
  { id: 'story', icon: '◷', name: 'Story Maker', category: 'STORYTELLING', detail: 'Fast, engaging mini stories', example: 'Ek student ko future ka AI robot milta hai' },
  { id: 'thumbnail', icon: '▧', name: 'Thumbnail Prompt', category: 'VISUALS', detail: 'Cinematic thumbnail prompts', example: 'Quantum computer, neon purple lab' },
  { id: 'image', icon: '▧', name: 'AI Image Creator', category: 'FREE · IMAGE', detail: 'Prompt se AI image generate karo', example: 'A futuristic purple AI lab, cinematic lighting' },
  { id: 'video', icon: '▶', name: 'AI Video Generator', category: 'PREMIUM · ₹99', detail: 'Agnes AI se short video generate karo', example: 'Vertical cinematic shot of a futuristic AI lab', premium: true }
];

export default function ToolGrid() {
  const [selected, setSelected] = useState('script');
  const [topic, setTopic] = useState('Ek aisa fact jo logon ko hairan kar de');
  const [result, setResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const active = useMemo(() => tools.find((tool) => tool.id === selected)!, [selected]);

  async function refreshAccess() {
    try {
      const response = await fetch('/api/video/access', { cache: 'no-store' });
      const data = await response.json();
      setHasAccess(response.ok && data.premium === true);
    } catch { setHasAccess(false); }
  }

  useEffect(() => {
    void refreshAccess();
    const onFocus = () => { void refreshAccess(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('kryptex-premium-updated', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('kryptex-premium-updated', onFocus);
    };
  }, []);

  const selectTool = (tool: Tool) => {
    setSelected(tool.id); setTopic(tool.example); setResult(''); setImageUrl(''); setError(''); setProgress('');
  };

  async function generate() {
    if (!topic.trim()) { setError('Pehle topic ya prompt likho.'); return; }
    if (selected === 'video' && !hasAccess) { setError('Video Studio use karne ke liye Premium unlock karo.'); return; }
    setBusy(true); setError(''); setResult(''); setImageUrl(''); setProgress('');
    try {
      if (selected === 'image') {
        const response = await fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: topic }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Image generate nahi ho payi.');
        setImageUrl(data.image || data.dataUrl || data.url || '');
        setResult('Image ready hai.'); setProgress('Image generated successfully.');
      } else if (selected !== 'video') {
        const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool: selected, topic }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Generator ne response nahi diya.');
        setResult(typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2));
      } else {
        const response = await fetch('/api/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: topic, seconds: 5, aspectRatio: '9:16' }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Video start nahi ho payi.');
        setProgress('Agnes queue mein request submit ho gayi…');
        for (let attempt = 0; attempt < 90; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const poll = await fetch('/api/video/status?videoId=' + encodeURIComponent(data.videoId), { cache: 'no-store' });
          const status = await poll.json();
          if (!poll.ok) throw new Error(status.error || 'Video status check nahi ho paya.');
          setProgress('Video generate ho rahi hai… ' + Math.max(0, Math.min(100, Number(status.progress) || 0)) + '%');
          if (status.status === 'completed' && status.url) { setResult(status.url); setProgress('Video ready hai.'); return; }
          if (['failed', 'error', 'cancelled'].includes(status.status)) throw new Error(status.error || 'Video generation fail ho gayi.');
        }
        setProgress('Generation abhi chal rahi ho sakti hai. Video Studio mein job dobara check karo.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request complete nahi ho payi.');
    } finally { setBusy(false); }
  }

  async function copyResult() {
    try { await navigator.clipboard.writeText(result); setProgress('Copied to clipboard ✓'); }
    catch { setProgress('Copy nahi hua — result ko select karke copy kar lo.'); }
  }

  return (
    <section id="tools" className="tools-section section-shell">
      <div className="section-heading"><div><div className="eyebrow">YOUR CREATOR TOOLKIT</div><h2>10 tools. <span className="gradient-text">One workspace.</span></h2><p>Tool choose karo, topic likho, aur create karna shuru karo.</p></div><span className="tool-count">10 GENERATORS</span></div>
      <div className="creator-workspace">
        <div className="tool-picker" aria-label="Choose a generator">{tools.map((tool) => <button key={tool.id} type="button" onClick={() => selectTool(tool)} className={'tool-card ' + (selected === tool.id ? 'selected' : '')}><span className="tool-icon">{tool.icon}</span><span className="tool-card-copy"><strong>{tool.name}</strong><small>{tool.detail}</small></span>{tool.premium ? <span className="premium-mini">{hasAccess ? 'ACTIVE' : '₹99'}</span> : <span className="tool-arrow">↗</span>}</button>)}</div>
        <div className="generator-panel">
          <div className="panel-topline"><span className="panel-icon">{active.icon}</span><span><small>{active.category}</small><h3>{active.name}</h3></span><span className="live-badge"><i /> {hasAccess && selected === 'video' ? 'PREMIUM ACTIVE' : 'READY'}</span></div>
          <p className="panel-description">{active.detail}. Apne idea ko neeche likho.</p>
          {active.premium && <div className="premium-note"><span>✦</span><div><strong>{hasAccess ? 'Premium access active hai' : 'Agnes Video Studio'}</strong><p>{hasAccess ? 'Aap video generate kar sakte ho.' : '₹99 plan unlock karne ke baad video generation available hogi.'}</p><Link className="text-link" href="/video-studio">Open full Video Studio ↗</Link>{!hasAccess && <p><Link className="text-link" href="/#pricing">Unlock Premium · ₹99 ↗</Link></p>}</div></div>}
          <label className="field-label" htmlFor="generator-topic">{selected === 'video' ? 'VIDEO SCENE PROMPT' : 'YOUR TOPIC / IDEA'}</label>
          <textarea id="generator-topic" value={topic} onChange={(event) => setTopic(event.target.value)} rows={5} maxLength={2500} placeholder="Apna idea yahan likho…" />
          <div className="panel-actions"><span className="char-count">{topic.length}/2500</span><button className="button-primary generate-button" type="button" onClick={generate} disabled={busy || (selected === 'video' && !hasAccess)}>{busy ? <><span className="spinner" /> Creating…</> : selected === 'video' ? '▶ Generate Video' : '✦ Generate'} <span>→</span></button></div>
          {error && <div className="error-box" role="alert">{error}</div>}{progress && !error && <p className="status-note" role="status">{progress}</p>}
          {result && <div className="result-card"><div className="result-header"><strong>{selected === 'video' ? 'YOUR VIDEO' : selected === 'image' ? 'YOUR IMAGE' : 'YOUR RESULT'}</strong>{selected !== 'video' && selected !== 'image' && <button type="button" className="copy-button" onClick={copyResult}>Copy ↗</button>}</div>{selected === 'video' && result.startsWith('http') ? <video className="video-result" controls playsInline src={'/api/video/download?url=' + encodeURIComponent(result)} /> : selected === 'image' && imageUrl ? <img className="tool-image-result" src={imageUrl} alt="AI generated image" /> : <pre>{result}</pre>}{selected === 'video' && result.startsWith('http') && <a className="text-link" href={'/api/video/download?url=' + encodeURIComponent(result)} download="kryptex-video.mp4">Download video ↓</a>}{selected === 'image' && imageUrl && <a className="text-link" href={imageUrl} target="_blank" rel="noreferrer">Open image ↗</a>}</div>}
        </div>
      </div>
    </section>
  );
}
