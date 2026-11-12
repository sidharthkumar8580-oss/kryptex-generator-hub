'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
type FF= {load:(o:{coreURL:string;wasmURL:string})=>Promise<void>;writeFile:(n:string,d:Uint8Array)=>Promise<void>;readFile:(n:string)=>Promise<Uint8Array>;exec:(a:string[])=>Promise<number>;on:(e:string,cb:(d:any)=>void)=>void;deleteFile:(n:string)=>Promise<void>};
export default function MediaEditor(){
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState(''),[result,setResult]=useState(''),[prompt,setPrompt]=useState('Make this clip concise and engaging. Remove unnecessary beginning and ending. Keep the main moment.');
 const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(''),[duration,setDuration]=useState(0),[mode,setMode]=useState<'video'|'image'|''>('');
 const ff=useRef<FF|null>(null),canvas=useRef<HTMLCanvasElement>(null),image=useRef<HTMLImageElement>(null);
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);if(result)URL.revokeObjectURL(result)},[preview,result]);
 function choose(f?:File){
  if(!f)return;
  const ext=f.name.split('.').pop()?.toLowerCase()||'';
  const videoExt=['mp4','m4v','mov','webm','ogv','ogg','3gp','3g2','mkv'];
  const imageExt=['jpg','jpeg','png','webp','gif','bmp','avif'];
  const detected=f.type|| (videoExt.includes(ext)?'video/'+(ext==='ogv'?'ogg':ext==='mov'?'quicktime':ext):imageExt.includes(ext)?'image/'+(ext==='jpg'?'jpeg':ext):'');
  if(!detected.startsWith('video/')&&!detected.startsWith('image/')){setError('Ye file format supported nahi hai. MP4, MOV, WEBM ya JPG/PNG choose karo.');return}
  if(f.size>120*1024*1024){setError('File 120 MB se chhoti rakho.');return}
  setFile(f);setMode(detected.startsWith('video/')?'video':'image');setPreview(URL.createObjectURL(f));setResult('');setError('');setStatus('');setDuration(0);
 }
 async function loadFF():Promise<FF>{
  if(ff.current)return ff.current;
  setStatus('Video editor engine download ho raha hai…');
  const imp=new Function('u','return import(u)') as (u:string)=>Promise<any>;
  const [mod,util]=await Promise.all([
   imp('https://esm.sh/@ffmpeg/ffmpeg@0.12.15?bundle&target=es2022'),
   imp('https://esm.sh/@ffmpeg/util@0.12.2?bundle&target=es2022')
  ]);
  const engine:FF=new mod.FFmpeg();
  engine.on('progress',(e:any)=>setStatus('Video process ho rahi hai… '+Math.round((Number(e?.progress)||0)*100)+'%'));
  const coreURL=await util.toBlobURL('https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js','text/javascript');
  const wasmURL=await util.toBlobURL('https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm','application/wasm');
  await engine.load({coreURL,wasmURL});
  ff.current=engine;
  return engine;
 }
 async function editPhoto(){if(!file||!image.current||!canvas.current)return;setBusy(true);setError('');setStatus('Photo enhance ho rahi hai…');try{const img=image.current,c=canvas.current,scale=Math.min(1,1920/img.naturalWidth);c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);const ctx=c.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.filter='brightness(1.06) contrast(1.08) saturate(1.12)';ctx.drawImage(img,0,0,c.width,c.height);const blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Photo export failed')),'image/jpeg',.92));setResult(URL.createObjectURL(blob));setStatus('Photo enhance complete. Download your edited image.')}catch(e){setError(e instanceof Error?e.message:'Photo edit failed');setStatus('')}finally{setBusy(false)}}
 async function editVideo(){if(!file||!duration)return;setBusy(true);setError('');setStatus('AI tumhari editing request se cut plan bana raha hai…');try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'system',content:'You are a video editing planner. You cannot see the video. Return only valid JSON: {"start": number, "end": number, "notes": string}. Choose a sensible continuous trim range based on user request and duration. If request asks for effects, transitions, subtitles or music, explain in notes that this editor only exports a trim and cannot apply those effects.'},{role:'user',content:'Duration '+duration+' seconds. Request: '+prompt}]})});const data=await res.json();if(!res.ok)throw Error(data.error||'AI plan failed');const plan=JSON.parse(String(data.reply||'').replace(/```json|```/g,'').trim());const start=Math.max(0,Math.min(Number(plan.start)||0,duration-1)),end=Math.max(start+1,Math.min(Number(plan.end)||duration,duration));if(end<=start)throw Error('Invalid AI edit plan');setStatus('AI plan ready: '+start.toFixed(1)+'s – '+end.toFixed(1)+'s. Export starting… '+(plan.notes||''));const engine=await loadFF();const ext=file.name.split('.').pop()?.toLowerCase()||'mp4';await engine.writeFile('kryptex-input.'+ext,new Uint8Array(await file.arrayBuffer()));const code=await engine.exec(['-ss',String(start),'-i','kryptex-input.'+ext,'-t',String(end-start),'-c','copy','-movflags','+faststart','kryptex-output.mp4']);if(code!==0)throw Error('Video export failed');const bytes=await engine.readFile('kryptex-output.mp4'),buf=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;setResult(URL.createObjectURL(new Blob([buf],{type:'video/mp4'})));setStatus('Edited clip ready! '+(plan.notes||''));try{await engine.deleteFile('kryptex-input.'+ext);await engine.deleteFile('kryptex-output.mp4')}catch{}}catch(e){setError(e instanceof Error?e.message:'Video edit failed');setStatus('')}finally{setBusy(false)}}
 return <main className="media-editor-page"><section className="media-editor-shell"><div className="media-editor-heading"><div><div className="eyebrow"><span className="kicker-dot"/> KRYPTEX CREATIVE TOOLS</div><h1>Media <span className="gradient-text">Editor.</span></h1><p>Upload a photo or video. Let AI help plan the edit, preview the result and export it — your original file stays unchanged.</p></div><Link href="/" className="studio-back">← Dashboard</Link></div>
 <section className="media-editor-card"><label className="media-drop"><input type="file" accept="video/*,image/*,.mp4,.m4v,.mov,.webm,.ogv,.3gp,.jpg,.jpeg,.png,.webp,.avif" onChange={e=>{choose(e.target.files?.[0]);e.currentTarget.value="";}}/><span className="media-drop-icon">↑</span><b>{file?file.name:'Drop your photo or video here'}</b><small>Or tap to browse · JPG, PNG, WEBP, MP4, MOV · max 120 MB</small></label>
 {preview&&<div className="media-workbench"><div className="media-preview">{mode==='video'?<video key={preview} src={preview} controls playsInline preload="metadata" onLoadedMetadata={e=>{const d=e.currentTarget.duration;if(Number.isFinite(d)&&d>0){setDuration(d);setError("");setStatus("Video preview ready · "+Math.round(d)+" seconds");}}} onCanPlay={()=>setError("")} onError={()=>{setDuration(0);setError("Phone browser is unable to play this video format/codec. MP4 (H.264) video try karo.");}}/>:<><img ref={image} src={preview} alt="Selected photo preview" onLoad={()=>setStatus('Photo ready to edit.')}/><canvas ref={canvas} hidden/></>}</div>
 {mode==='video'?<><label className="field-label" htmlFor="media-prompt">WHAT SHOULD AI CHANGE?</label><textarea id="media-prompt" value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={500}/><button className="button-primary media-edit-button" disabled={busy||!duration||!prompt.trim()} onClick={()=>void editVideo()}>{busy?'✦ Editing…':'✦ AI edit video'}</button><small className="media-note">AI currently suggests a trim using your instructions and video duration. This editor does not visually inspect footage or automatically add effects, music or captions.</small></>:<><div className="photo-edit-copy"><b>One-tap photo enhancement</b><span>Balanced brightness, contrast and colour for a cleaner image.</span></div><button className="button-primary media-edit-button" disabled={busy||!image.current?.complete} onClick={()=>void editPhoto()}>{busy?'✦ Enhancing…':'✦ Auto enhance photo'}</button></>}
 {status&&<p className="status-note" role="status">{status}</p>}{error&&<div className="error-box" role="alert">{error}</div>}
 {result&&<div className="media-result"><div className="field-label">EDITED RESULT</div>{mode==='video'?<video src={result} controls playsInline/>:<img src={result} alt="Edited photo"/>}<a className="button-primary" href={result} download={mode==='video'?'kryptex-edited-video.mp4':'kryptex-enhanced-photo.jpg'}>↓ Download edited {mode}</a></div>}
 </div>}</section><p className="media-privacy">🔒 Your media is processed in this browser and is not uploaded to Kryptex servers by this editor. Video processing may use significant phone memory.</p></section></main>
}
