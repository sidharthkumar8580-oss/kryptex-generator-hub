import Link from 'next/link';
import ToolGrid from '@/components/ToolGrid';

const tools = [
  ['✦','AI Video','Generate cinematic clips','/video-studio'],
  ['▧','Photo & Video Editor','Upload and auto-edit media','/editor'],
  ['◉','Voice Assistant','Talk naturally with AI','/ai'],
  ['⌘','Creator Tools','Scripts, hooks, titles and SEO','#tools']
];
export default function HomePage(){
 return <main className="kryptex-home">
  <section className="dash-hero section-shell">
   <div className="dash-hero-copy"><div className="eyebrow"><span className="kicker-dot"/> YOUR CREATIVE SPACE</div>
    <h1>Everything you create.<br/><span className="gradient-text">One beautiful workspace.</span></h1>
    <p>Create AI videos, edit your own photos and clips, make content, and chat with your voice assistant — all from one place.</p>
    <div className="hero-actions"><Link href="/#tools" className="dash-primary">✧ Explore all tools <span>→</span></Link><Link href="/editor" className="dash-secondary">Open media editor ↗</Link></div>
    <div className="clean-badges"><span>● Free to access</span><span>✦ AI-powered workspace</span><span>◉ Built for mobile</span></div>
   </div>
   <div className="dash-hero-art"><div className="dash-art-orbit orbit-a"/><div className="dash-art-orbit orbit-b"/><div className="dash-art-card"><div className="dash-art-top"><span>✦</span><small>CREATIVE WORKSPACE</small><i>● LIVE</i></div><div className="dash-art-preview"><span>▶</span></div><div className="dash-art-bottom"><b>Make your next idea real.</b><small>VIDEO · PHOTO · AI</small></div></div></div>
  </section>
  <section className="dash-grid section-shell">
   <article className="dash-panel dash-quick"><h3>Quick access</h3><p>Your creative tools, one tap away.</p>{tools.map(([icon,title,desc,href])=><Link href={href} className="dash-tool-row" key={title}><span>{icon}</span><div><b>{title}</b><small>{desc}</small></div><i>↗</i></Link>)}</article>
   <article className="dash-panel dash-feature"><div className="dash-panel-label">FEATURED WORKSPACE</div><div className="dash-feature-icon">✂</div><h2>Make every frame count.</h2><p>Upload a photo or video, describe the result you want, and use the built-in editor to prepare your next post.</p><Link href="/editor" className="dash-outline">Open media editor <span>→</span></Link><div className="dash-feature-chips"><span>PHOTO</span><span>VIDEO</span><span>EXPORT</span></div></article>
   <article className="dash-panel dash-recommend"><div className="dash-panel-label">YOUR AI COMPANION</div><div className="dash-orb-mini">✦</div><h3>Say it. Ask it. Create it.</h3><p>Chat with AI, ask questions, get ideas and enjoy voice replies.</p><Link href="/ai" className="dash-outline">Open AI assistant ↗</Link><small className="dash-footnote">Voice conversation uses your phone’s built-in microphone after permission.</small></article>
  </section>
  <ToolGrid/>
  <footer className="site-footer clean-footer"><Link href="/" className="footer-brand"><span className="brand-mark">K</span><span><strong>KRYPTEX STUDIO</strong><small>CREATE WITHOUT CLUTTER</small></span></Link><span>© {new Date().getFullYear()} Kryptex Studio</span><span className="footer-links"><Link href="/editor">Media Editor</Link><Link href="/ai">AI Assistant</Link><a href="https://www.youtube.com/@Ankitkryptex" target="_blank" rel="noreferrer">YouTube</a></span></footer>
 </main>;
}
