import Link from 'next/link';
import ToolGrid from '@/components/ToolGrid';
import PricingSection from '@/components/PricingSection';

const features = [
  { icon: '✦', name: 'Ankit Kryptex AI', detail: 'Chat + image creation', tone: 'violet' },
  { icon: '▤', name: 'Creator tools', detail: '10 focused generators', tone: 'pink' },
  { icon: '▶', name: 'Video studio', detail: 'Premium AI video jobs', tone: 'blue' }
];

export default function HomePage() {
  return <main>
    <section className="hero-section section-shell">
      <div className="hero-copy">
        <div className="hero-kicker"><span className="kicker-dot" /> CREATOR TOOLKIT · BUILT FOR YOUR IDEAS</div>
        <h1>Ek website.<br /><span className="gradient-text">Saare kaam.</span><br />Apna AI.</h1>
        <p className="hero-description">Ideas ko scripts mein badlo, visuals banao aur apne next Short ki planning karo — Ankit Kryptex ke liye bana ek clean creative workspace.</p>
        <div className="hero-actions"><a href="#tools" className="button-primary">Start creating <span>↗</span></a><Link href="/ai" className="button-secondary"><span>✦</span> Meet Ankit AI</Link></div>
        <div className="hero-social-proof"><span className="mini-stack"><i>K</i><i>✦</i><i>AI</i></span><span><strong>Made for creators</strong><small>Hindi-first · Mobile-friendly · One workspace</small></span></div>
      </div>
      <div className="hero-visual" aria-label="Kryptex Generator Hub preview illustration">
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="visual-core"><span className="core-k">K</span><span className="core-spark">✦</span></div>
        <div className="floating-panel panel-script"><span className="mini-icon purple-icon">▤</span><span><small>SHORTS SCRIPT</small><strong>Idea → Story → Hook</strong></span><i className="panel-check">✓</i></div>
        <div className="floating-panel panel-image"><span className="mini-icon pink-icon">▧</span><span><small>IMAGE STUDIO</small><strong>Prompt to visual</strong></span><span className="panel-bars"><i /><i /><i /><i /></span></div>
        <div className="floating-panel panel-chat"><span className="chat-faces">✦</span><span><small>ANKIT AI</small><strong>Ready when you are</strong></span><span className="active-pulse" /></div>
        <div className="hero-visual-label"><span className="label-led" /> YOUR CREATIVE SPACE <span>V1.0</span></div>
      </div>
    </section>

    <section className="feature-strip section-shell" aria-label="Platform features">{features.map((feature) => <div className="feature-item" key={feature.name}><span className={`feature-icon ${feature.tone}`}>{feature.icon}</span><span><strong>{feature.name}</strong><small>{feature.detail}</small></span><span className="feature-chevron">↗</span></div>)}</section>

    <ToolGrid />

    <section className="ai-cta-section section-shell"><div className="cta-orb">✦</div><div><div className="eyebrow">GOT A BIG IDEA?</div><h2>Just ask <span className="gradient-text">Ankit AI.</span></h2><p>Normal chat karo ya image banane ke liye bolo. AI chat ek full-screen workspace mein khulta hai.</p></div><Link className="button-primary cta-button" href="/ai">Open Ankit Kryptex AI <span>↗</span></Link></section>

    <PricingSection />

    <section className="channel-section section-shell"><div className="channel-left"><span className="youtube-mark">▶</span><div><div className="eyebrow">FOLLOW THE JOURNEY</div><h2>Ankit Kryptex on YouTube</h2><p>AI, digital world, cybersecurity awareness, science aur mind-blowing facts — Hindi mein.</p></div></div><a className="youtube-button" href="https://www.youtube.com/@Ankitkryptex" target="_blank" rel="noreferrer">Visit @Ankitkryptex <span>↗</span></a></section>

    <footer className="site-footer"><Link href="/" className="footer-brand"><span className="brand-mark">K</span><span><strong>ANKIT KRYPTEX</strong><small>CREATE WITHOUT CLUTTER</small></span></Link><span>© {new Date().getFullYear()} Kryptex Generator Hub</span><span className="footer-links"><a href="https://www.youtube.com/@Ankitkryptex" target="_blank" rel="noreferrer">YouTube</a><Link href="/ai">Ankit AI</Link><a href="#pricing">Pricing</a></span></footer>
  </main>;
}
