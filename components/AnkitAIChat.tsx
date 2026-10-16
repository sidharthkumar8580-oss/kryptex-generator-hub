'use client';
import Link from 'next/link';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

type Message = { id: string; role: 'user' | 'assistant'; content: string; imageUrl?: string; videoUrl?: string; progress?: number; status?: 'typing' | 'generating' | 'done' | 'error' };
type Session = { id: string; title: string; messages: Message[]; createdAt: number };
const starters = ['Mujhe 30 second ki AI fact script do','Quantum computer simple Hindi mein samjhao','Ek futuristic AI thumbnail image banao','Mere Short ke liye 10 hooks likho'];
const VALID_COUPON = "KRYPTEX7FREE";
const SESSION_KEY = "kryptex-ai-sessions-v2";

function looksLikeImageRequest(t:string){ const v=t.toLowerCase(); return /(image|tasveer|photo|picture|thumbnail|wallpaper|portrait|human|man|woman|girl|boy|person|चित्र|तस्वीर).{0,45}(bana|banado|bana do|generate|create|draw|dikha|make)|(?:bana|banado|bana do|generate|create|draw|make|chahiye).{0,45}(image|tasveer|photo|picture|thumbnail|portrait|human|man|woman|girl|boy|person|चित्र|तस्वीर)/i.test(v); }
function looksLikeVideoRequest(t:string){ const v=t.toLowerCase(); return v.includes('video banao')||v.includes('video generate')||v.includes('video bana')||v.startsWith('video:'); }
function enhanceHumanPrompt(prompt:string){
  const isHuman = /(man|woman|girl|boy|person|human|face|portrait|model|actor|influencer|bhabhi|aunty|didi|yogi|meditation|muscular|bodybuilder)/i.test(prompt);
  if(!isHuman) return prompt;
  return `${prompt}, ultra realistic human, beautiful detailed face, natural skin texture, sharp focus, 8k DSLR photo, studio lighting, symmetrical eyes, perfect hands, realistic body, no blur, no distorted face, no extra limbs`;
}

export default function AnkitAIChat(){
  const [sessions,setSessions]=useState<Session[]>([]);
  const [activeId,setActiveId]=useState<string>('');
  const [hydrated,setHydrated]=useState(false);
  const [draft,setDraft]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [showPlus,setShowPlus]=useState(false);
  const [showDots,setShowDots]=useState(false);
  const [showMobileSidebar,setShowMobileSidebar]=useState(false);
  const [uploadPreview,setUploadPreview]=useState<string|null>(null);
  const [mode,setMode]=useState<'chat'|'image'|'video'>('chat');
  const [previewImg,setPreviewImg]=useState<string|null>(null);
  const endRef=useRef<HTMLDivElement>(null);
  const textareaRef=useRef<HTMLTextAreaElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const activeSession=sessions.find(s=>s.id===activeId)||sessions[0];

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(SESSION_KEY);
      if(raw){ const p=JSON.parse(raw) as Session[]; if(p.length){ setSessions(p); setActiveId(p[0].id); setHydrated(true); return; } }
    }catch{}
    const id=Date.now().toString(); const sess:Session={id,title:'New Chat',messages:[],createdAt:Date.now()}; setSessions([sess]); setActiveId(id); setHydrated(true);
  },[]);
  useEffect(()=>{ if(!hydrated) return; try{ localStorage.setItem(SESSION_KEY,JSON.stringify(sessions.slice(0,20))); }catch{} },[sessions,hydrated]);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth',block:'end'}); },[activeSession?.messages,busy]);

  function createNewChat(){ const id=Date.now().toString(); const sess:Session={id,title:'New Chat',messages:[],createdAt:Date.now()}; setSessions(prev=>[sess,...prev]); setActiveId(id); setShowDots(false); setShowMobileSidebar(false); setError(''); }
  function deleteSession(id:string){ const f=sessions.filter(s=>s.id!==id); if(f.length===0){ const nid=Date.now().toString(); const ns:Session={id:nid,title:'New Chat',messages:[],createdAt:Date.now()}; setSessions([ns]); setActiveId(nid);} else{ setSessions(f); if(id===activeId) setActiveId(f[0].id);} setShowDots(false); }
  function deleteAllHistory(){ if(!confirm('Saari history delete?')) return; const id=Date.now().toString(); const sess:Session={id,title:'New Chat',messages:[],createdAt:Date.now()}; setSessions([sess]); setActiveId(id); localStorage.removeItem(SESSION_KEY); }
  function updateActive(updater:(s:Session)=>Session){ setSessions(prev=>prev.map(s=>s.id===activeId?updater(s):s)); }
  async function typeWriter(fullText:string,msgId:string){ let typed=''; for(let i=0;i<fullText.length;i++){ typed+=fullText[i]; if(i%3===0||i===fullText.length-1){ const cur=typed; updateActive(s=>({...s,messages:s.messages.map(m=>m.id===msgId?{...m,content:cur,status:'typing'}:m)})); await new Promise(r=>setTimeout(r,15)); } } updateActive(s=>({...s,messages:s.messages.map(m=>m.id===msgId?{...m,status:'done'}:m)})); }
  function downloadImage(url:string){ const a=document.createElement('a'); a.href=url; a.download=`kryptex-${Date.now()}.png`; a.target='_blank'; a.click(); }

  async function send(rawText=draft){
    const text=rawText.trim(); if(!text||busy||!activeSession) return;
    const finalPrompt = enhanceHumanPrompt(text);
    const userMessage:Message={id:crypto.randomUUID(),role:'user',content:text,imageUrl:uploadPreview||undefined};
    const assistantId=crypto.randomUUID();
    const isImage=mode==='image'||looksLikeImageRequest(text)||!!uploadPreview;
    const isVideo=mode==='video'||looksLikeVideoRequest(text);
    updateActive(s=>{ const title=s.messages.length===0?text.slice(0,32):s.title; return {...s,title,messages:[...s.messages,userMessage,{id:assistantId,role:'assistant',content:'',status:'generating',progress:0}]}; });
    setDraft(''); setUploadPreview(null); setShowPlus(false); setBusy(true); setError(''); setMode('chat');
    try{
      if(isVideo){
        updateActive(s=>({...s,messages:s.messages.map(m=>m.id===assistantId?{...m,content:'Video queue mein hai...',progress:5,status:'generating'}:m)}));
        const res=await fetch('/api/video',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:finalPrompt,seconds:5,aspectRatio:'9:16',coupon:VALID_COUPON})});
        const data=await res.json(); if(!res.ok) throw new Error(typeof data.error==='string'?data.error:JSON.stringify(data.error));
        for(let attempt=0;attempt<40;attempt++){ await new Promise(r=>setTimeout(r,4000)); const poll=await fetch(`/api/video/status?videoId=${encodeURIComponent(data.videoId)}&coupon=${VALID_COUPON}`,{cache:'no-store'}); const st=await poll.json(); if(!poll.ok) throw new Error(typeof st.error==='string'?st.error:JSON.stringify(st.error)); updateActive(s=>({...s,messages:s.messages.map(m=>m.id===assistantId?{...m,content:`Video generate ho rahi hai... ${st.progress||0}%`,progress:st.progress||Math.min(90,attempt*3),status:'generating'}:m)})); if(st.status==='completed'&&st.url){ updateActive(s=>({...s,messages:s.messages.map(m=>m.id===assistantId?{...m,content:'Video ready hai! 🎬',videoUrl:st.url,progress:100,status:'done'}:m)})); break; } if(st.status==='failed') throw new Error(st.error||'Video fail'); }
      } else if(isImage){
        updateActive(s=>({...s,messages:s.messages.map(m=>m.id===assistantId?{...m,content:'Image bana raha hu...',progress:10,status:'generating'}:m)}));
        const res=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:finalPrompt,image:uploadPreview})});
        const data=await res.json(); if(!res.ok) throw new Error(typeof data.error==='string'?data.error:JSON.stringify(data.error));
        for(let p=30;p<=80;p+=25){ await new Promise(r=>setTimeout(r,350)); updateActive(s=>({...s,messages:s.messages.map(m=>m.id===assistantId?{...m,progress:p}:m)})); }
        const imgUrl=data.dataUrl||data.url; updateActive(s=>({...s,messages:s.messages.map(m=>m.id===assistantId?{...m,content:'Ye rahi tumhari image! 🖼️ Click karke download karo',imageUrl:imgUrl,progress:100,status:'done'}:m)}));
      } else {
        const msgsForApi=[...(activeSession?.messages||[]).filter(m=>!m.imageUrl&&!m.videoUrl).map(({role,content})=>({role,content})),{role:'user',content:text}];
        const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgsForApi})});
        const data=await res.json(); if(!res.ok) throw new Error(typeof data.error==='string'?data.error:JSON.stringify(data.error));
        const full=data.reply||'Samajh gaya!'; updateActive(s=>({...s,messages:s.messages.map(m=>m.id===assistantId?{...m,content:'',status:'typing'}:m)})); await typeWriter(full,assistantId);
      }
    }catch(err){ const msg=err instanceof Error?err.message:'Connection error'; updateActive(s=>({...s,messages:s.messages.map(m=>m.id===assistantId?{...m,content:`Error: ${msg}`,status:'error',progress:0}:m)})); setError(msg); }
    finally{ setBusy(false); textareaRef.current?.focus(); }
  }

  return <main className="ai-page">
    <aside className={`ai-sidebar ${showMobileSidebar?'mobile-open':''}`}>
      <Link href="/" className="brand ai-sidebar-brand"><span className="brand-mark">K</span><span className="brand-copy"><strong>ANKIT KRYPTEX</strong><small>GENERATOR HUB</small></span></Link>
      <button type="button" className="new-chat-button" onClick={createNewChat}>＋ <span>New chat</span></button>
      <div className="sidebar-label">CHAT HISTORY ({sessions.length})</div>
      <div className="history-list">{sessions.map(s=>(<div key={s.id} className={`sidebar-item ${s.id===activeId?'active':''}`} onClick={()=>{setActiveId(s.id); setShowMobileSidebar(false);}}><span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.title}</span><button className="history-del" onClick={(ev)=>{ev.stopPropagation(); deleteSession(s.id);}}>✕</button></div>))}</div>
      <Link className="sidebar-item" href="/#tools">▤ <span>All generators</span></Link>
      <div className="sidebar-spacer" /><button onClick={deleteAllHistory} className="sidebar-item" style={{color:'#ff6b6b',border:'1px solid #333'}}>🗑️ Delete All History</button>
      <div className="sidebar-user"><span className="avatar">K</span><span><strong>Ankit Kryptex</strong><small>Creator workspace</small></span></div>
    </aside>
    <section className="ai-chat-area">
      <header className="chat-topbar"><div className="chat-title"><button className="mobile-menu-btn" onClick={()=>setShowMobileSidebar(true)}>☰</button><span className="ai-orb">✦</span><span><strong>Ankit Kryptex AI</strong><small>Creative assistant · Chat + Images</small></span></div><div className="chat-top-actions"><span className="online-pill"><i /> AI ready</span><div style={{position:'relative'}}><button type="button" className="dots-btn" onClick={()=>setShowDots(!showDots)}>⋮</button>{showDots&&(<div className="dots-menu"><button onClick={createNewChat}>＋ New Chat</button><button onClick={()=>activeId&&deleteSession(activeId)}>🗑️ Delete Current Chat</button><Link href="/" onClick={()=>setShowDots(false)}>← Home</Link></div>)}</div></div></header>
      <div className="chat-scroll"><div className="chat-content">{!activeSession||activeSession.messages.length===0?<div className="chat-welcome"><div className="welcome-orb"><span>✦</span><i /><b /></div><div className="eyebrow">YOUR CREATIVE CO-PILOT</div><h1>Hey creator, <span className="gradient-text">what's on your mind?</span></h1><p>Hindi mein baat karo. Ideas, scripts, tech explainers aur images — sab ek jagah.</p><div className="starter-grid">{starters.map((starter)=><button type="button" key={starter} onClick={()=>setDraft(starter)}>{starter}<span>↗</span></button>)}</div></div>:<div className="messages-list">{activeSession.messages.map((message)=>(<article key={message.id} className={`chat-message ${message.role}`}><div className={`message-avatar ${message.role==='assistant'?'assistant-avatar':''}`}>{message.role==='assistant'?'✦':'A'}</div><div className="message-body"><div className="message-author">{message.role==='assistant'?'ANKIT KRYPTEX AI':'YOU'}</div><div className="message-text">{message.content}{message.status==='typing'&&message.content?<span className="cursor">▌</span>:null}</div>{message.status==='generating'&&(<div className="live-progress"><div className="live-progress-bar" style={{width:`${message.progress||0}%`}} /><small>{message.progress||0}% • Thinking...</small></div>)}{message.imageUrl&&<div className="generated-image-wrap"><img src={message.imageUrl} alt="AI generated" className="generated-image" onClick={()=>setPreviewImg(message.imageUrl!)} style={{cursor:'zoom-in'}} /><button className="img-download-btn" onClick={()=>downloadImage(message.imageUrl!)}>⬇ Download</button></div>}{message.videoUrl&&<div className="generated-image-wrap"><video src={message.videoUrl} controls playsInline className="generated-image" /><button className="img-download-btn" onClick={()=>downloadImage(message.videoUrl!)}>⬇ Download Video</button></div>}</div></article>))}<div ref={endRef} /></div>}</div></div>
      {error&&<div className="chat-error" role="alert">{error}</div>}
      {uploadPreview&&(<div className="upload-preview-bar"><img src={uploadPreview} alt="preview" /><span>Photo selected</span><button onClick={()=>setUploadPreview(null)}>✕</button></div>)}
      <div className="composer-area"><form className="chat-composer" onSubmit={(e:FormEvent)=>{e.preventDefault(); void send();}}><div className="plus-wrapper"><button type="button" className="pink-plus-btn" onClick={()=>setShowPlus(!showPlus)}>＋</button>{showPlus&&(<div className="plus-menu"><button type="button" onClick={()=>fileRef.current?.click()}><span>📷</span> Photo Upload</button><button type="button" onClick={()=>{setMode('image'); setShowPlus(false);}}><span>🖼️</span> Generate Image</button><button type="button" onClick={()=>{setMode('video'); setShowPlus(false);}}><span>🎬</span> Generate Video</button></div>)}</div><input ref={fileRef} type="file" accept="image/*" hidden onChange={(e)=>{const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{setUploadPreview(r.result as string); setMode('image');}; r.readAsDataURL(f); setShowPlus(false);}} /><textarea ref={textareaRef} value={draft} onChange={(e)=>setDraft(e.target.value)} onKeyDown={(e:KeyboardEvent<HTMLTextAreaElement>)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault(); void send();}}} rows={1} maxLength={5000} placeholder={mode==='image'?'Image prompt likho...':mode==='video'?'Video scene likho...':'Ankit AI se kuch bhi poochho...'} /><button className="send-button" type="submit" disabled={busy||!draft.trim()}>↑</button></form><div className="composer-foot"><span>{mode!=='chat'?`${mode} mode active`:'Chat mode'}</span><span>Enter to send</span></div></div>
    </section>
    {showMobileSidebar&&<div className="sidebar-overlay" onClick={()=>setShowMobileSidebar(false)} />}
    {previewImg&&<div className="img-lightbox" onClick={()=>setPreviewImg(null)}><div className="lightbox-inner" onClick={(e)=>e.stopPropagation()}><img src={previewImg} alt="preview" /><div className="lightbox-actions"><button onClick={()=>downloadImage(previewImg)} className="pink-download">⬇ Download HD</button><button onClick={()=>setPreviewImg(null)} className="lightbox-close">✕ Close</button></div></div></div>}
    <style>{`
.chat-topbar{position:sticky!important;top:0!important;z-index:50!important;background:rgba(10,10,10,0.92)!important;backdrop-filter:blur(12px)!important;border-bottom:1px solid #1a1a1a!important}
.ai-chat-area{display:flex!important;flex-direction:column!important;min-height:100vh!important}
.chat-scroll{flex:1!important;overflow-y:auto!important}
.composer-area{position:sticky!important;bottom:0!important;z-index:45!important;background:#0a0a0a!important;border-top:1px solid #1a1a1a!important}
.ai-sidebar.mobile-open{transform:translateX(0)!important;z-index:150!important;left:0!important;display:flex!important;opacity:1!important;visibility:visible!important}
.sidebar-overlay{position:fixed!important;inset:0!important;background:rgba(0,0,0,0.7)!important;z-index:140!important}
.dots-menu{position:fixed!important;right:12px!important;top:64px!important;z-index:200!important}
.mobile-menu-btn{background:#1a1a1a!important;border:1px solid #333!important;color:white!important;border-radius:8px!important;padding:6px 10px!important;margin-right:8px!important;display:none!important}
@media(max-width:900px){.mobile-menu-btn{display:flex!important}.ai-sidebar{transform:translateX(-105%)!important;position:fixed!important;left:0!important;top:0!important;bottom:0!important;z-index:100!important;transition:transform 0.3s ease!important;width:280px!important;background:#0a0a0a!important}}
.pink-plus-btn{width:38px;height:38px;border-radius:50%;background:#ec4899!important;color:white;border:none;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 0 4px rgba(236,72,153,0.25),0 0 20px rgba(236,72,153,0.4);transition:0.2s}
.pink-plus-btn:hover{transform:scale(1.08);box-shadow:0 0 0 6px rgba(236,72,153,0.3),0 0 25px rgba(236,72,153,0.5)}
.generated-image-wrap{position:relative;margin-top:10px}
.generated-image{width:100%;max-width:520px;border-radius:14px;border:1px solid #2a2a2a;transition:0.2s}
.generated-image:hover{transform:scale(1.01);border-color:#ec4899}
.img-download-btn{position:absolute;bottom:10px;right:10px;background:#ec4899;color:white;border:none;padding:6px 12px;border-radius:20px;font-size:12px;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.4)}
.img-lightbox{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)}
.lightbox-inner{display:flex;flex-direction:column;gap:16px;max-width:90vw;max-height:90vh}
.lightbox-inner img{max-width:90vw;max-height:75vh;object-fit:contain;border-radius:16px;border:2px solid #333}
.lightbox-actions{display:flex;gap:12px;justify-content:center}
.pink-download{background:#ec4899;color:white;border:none;padding:12px 24px;border-radius:30px;font-weight:600;cursor:pointer;box-shadow:0 0 20px rgba(236,72,153,0.4)}
.lightbox-close{background:#222;border:1px solid #333;color:white;padding:12px 20px;border-radius:30px;cursor:pointer}
.history-list{display:flex;flex-direction:column;gap:6px;max-height:38vh;overflow:auto;margin-bottom:12px}
.history-del{background:none;border:none;color:#777;cursor:pointer;padding:2px 6px;border-radius:4px}
.history-del:hover{background:#333;color:white}
.dots-btn{background:#1a1a1a;border:1px solid #333;color:white;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:18px;z-index:10}
.dots-menu{background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:6px;display:flex;flex-direction:column;gap:4px;min-width:180px;box-shadow:0 10px 30px rgba(0,0,0,0.8)}
.dots-menu button,.dots-menu a{padding:10px 14px;background:#222;border:none;color:white;border-radius:8px;text-align:left;cursor:pointer;text-decoration:none}
.plus-wrapper{position:relative;display:flex;align-items:center}
.plus-menu{position:absolute;bottom:48px;left:0;background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:6px;display:flex;flex-direction:column;gap:6px;z-index:100;min-width:200px;box-shadow:0 10px 30px rgba(0,0,0,0.5)}
.plus-menu button{padding:12px 14px;background:#222;border:1px solid #333;color:white;border-radius:10px;display:flex;gap:10px;cursor:pointer;text-align:left}
.live-progress{margin-top:10px;background:#222;border-radius:8px;height:28px;position:relative;overflow:hidden;display:flex;align-items:center}
.live-progress-bar{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#ec4899,#7c3aed);transition:width 0.5s ease}
.live-progress small{position:relative;z-index:1;padding:0 12px;font-size:12px}
.cursor{animation:blink 1s infinite}@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
.upload-preview-bar{display:flex;gap:10px;align-items:center;padding:8px 16px;background:#111;border-top:1px solid #222}
.upload-preview-bar img{width:44px;height:44px;border-radius:8px;object-fit:cover}
`}</style>
  </main>;
}
