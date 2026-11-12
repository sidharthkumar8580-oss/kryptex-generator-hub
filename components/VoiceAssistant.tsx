'use client';

import { useEffect, useRef, useState } from 'react';

type SpeechResult = { 0: { transcript: string }; isFinal: boolean };
type SpeechEvent = { results: ArrayLike<SpeechResult> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export default function VoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);

  function startListening() {
    const speechWindow = window as SpeechWindow;
    const RecognitionApi = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!RecognitionApi) {
      setError('Is browser mein voice input support nahi hai. Chrome mein try karo ya neeche type karo.');
      return;
    }
    setError('');
    const recognition = new RecognitionApi();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map((item) => item[0].transcript).join(' ').trim();
      if (text) setDraft(text);
    };
    recognition.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone permission allow karo.' : 'Voice samajh nahi aayi. Dobara try karo.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); }
    catch { setListening(false); setError('Microphone start nahi ho paya. Dobara try karo.'); }
  }

  async function ask() {
    const question = draft.trim();
    if (!question || busy) return;
    setBusy(true); setError(''); setAnswer(''); setDraft('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: question }] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI reply nahi de paya.');
      setAnswer(String(data.reply || 'Mujhe reply nahi mila.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error.');
    } finally { setBusy(false); }
  }

  function speakAnswer() {
    if (!answer || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.lang = /[\u0900-\u097F]/.test(answer) ? 'hi-IN' : 'en-IN';
    utterance.rate = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  return <>
    <button className="voice-launch" type="button" onClick={() => setOpen(!open)} aria-label="Open voice assistant">
      <span>{open ? '×' : '🎙'}</span><b>{open ? 'Close' : 'Voice AI'}</b>
    </button>
    {open && <aside className="voice-panel" aria-label="Voice assistant panel">
      <div className="voice-panel-head"><div><small>ANKIT KRYPTEX</small><strong>Voice Assistant</strong></div><button type="button" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
      <p className="voice-hint">Hindi ya English mein bolo, ya message type karo. AI ka jawab sun bhi sakte ho.</p>
      <div className="voice-controls">
        <button className={listening ? 'voice-mic listening' : 'voice-mic'} type="button" onClick={listening ? () => recognitionRef.current?.stop() : startListening} disabled={busy}>{listening ? '■ Stop listening' : '🎙 Speak'}</button>
        <span>{listening ? 'Listening…' : 'Mic permission required'}</span>
      </div>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} placeholder="Apna sawal yahan likho..." />
      <button className="voice-send" type="button" onClick={() => void ask()} disabled={busy || !draft.trim()}>{busy ? 'Thinking…' : 'Ask Ankit AI →'}</button>
      {error && <p className="voice-error" role="alert">{error}</p>}
      {answer && <div className="voice-answer"><strong>AI ka jawab</strong><p>{answer}</p><div><button type="button" onClick={speakAnswer} disabled={speaking}>▶ {speaking ? 'Speaking…' : 'Listen'}</button><button type="button" onClick={stopSpeaking}>■ Stop</button></div></div>}
      <small className="voice-footnote">Voice recognition browser ke support aur microphone permission par depend karta hai.</small>
    </aside>}
    <style jsx>{`
      .voice-launch{position:fixed;z-index:90;right:24px;bottom:88px;display:flex;align-items:center;gap:8px;padding:12px 16px;border:1px solid rgba(224,180,255,.4);border-radius:30px;background:linear-gradient(120deg,#7e22ce,#db2777);color:#fff;font-size:12px;font-weight:800;box-shadow:0 10px 30px #0008;cursor:pointer}
      .voice-launch span{font-size:17px}.voice-panel{position:fixed;z-index:100;right:22px;bottom:142px;width:min(360px,calc(100vw - 28px));max-height:min(72vh,650px);overflow:auto;padding:16px;border:1px solid #42334f;border-radius:18px;background:#111016;color:#f5edff;box-shadow:0 18px 60px #000b}
      .voice-panel-head{display:flex;justify-content:space-between;align-items:center}.voice-panel-head div{display:flex;flex-direction:column;gap:4px}.voice-panel-head small{font-size:8px;letter-spacing:.16em;color:#b78be7}.voice-panel-head strong{font-size:16px}.voice-panel-head button{border:0;background:#292331;color:#fff;border-radius:9px;width:30px;height:30px;font-size:20px;cursor:pointer}
      .voice-hint{font-size:11px;line-height:1.6;color:#aaa0b6}.voice-controls{display:flex;align-items:center;gap:10px;margin:12px 0}.voice-controls span,.voice-footnote{font-size:9px;color:#8f859b}.voice-mic,.voice-send{border:0;border-radius:10px;padding:10px 13px;background:linear-gradient(120deg,#9333ea,#db2777);color:#fff;font-size:11px;font-weight:750;cursor:pointer}.voice-mic.listening{background:#be123c}.voice-panel textarea{width:100%;resize:vertical;border:1px solid #393040;border-radius:10px;background:#09080d;color:#fff;padding:11px;font:inherit;font-size:12px;outline:none}.voice-send{width:100%;margin-top:8px}.voice-send:disabled{opacity:.5}.voice-error{font-size:10px;color:#fda4af}.voice-answer{margin-top:13px;padding:12px;border:1px solid #382b47;border-radius:12px;background:#191420}.voice-answer strong{font-size:10px;color:#d8b4ff}.voice-answer p{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px;line-height:1.65;color:#e8dfef}.voice-answer div{display:flex;gap:8px}.voice-answer button{border:1px solid #544163;border-radius:8px;background:#251c30;color:#e9d5ff;padding:7px 10px;font-size:10px;cursor:pointer}.voice-footnote{display:block;margin-top:12px;line-height:1.5}
      @media(max-width:600px){.voice-launch{right:14px;bottom:78px;padding:10px 13px}.voice-panel{right:10px;bottom:130px}}
    `}</style>
  </>;
}
