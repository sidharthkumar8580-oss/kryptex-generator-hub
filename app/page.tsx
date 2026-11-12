import Link from 'next/link';
import ToolGrid from '@/components/ToolGrid';

export default function HomePage() {
  return <main className="kryptex-home">
    <section className="clean-hero section-shell">
      <div className="eyebrow"><span className="kicker-dot" /> KRYPTEX CREATOR WORKSPACE</div>
      <h1>Make something <span className="gradient-text">amazing.</span></h1>
      <p>Scripts, ideas, images, videos aur AI assistant — saare tools ek hi jagah, simple aur clean.</p>
      <div className="hero-actions">
        <a href="#tools" className="button-primary">Explore all tools ↓</a>
        <Link href="/ai" className="button-secondary">✦ Open Ankit AI</Link>
        <Link href="/video-studio" className="button-secondary">▶ Video Studio</Link>
      </div>
      <div className="clean-badges"><span>✓ Free access</span><span>✓ Mobile friendly</span><span>✓ Hindi + English</span></div>
    </section>
    <ToolGrid />
    <footer className="site-footer clean-footer">
      <Link href="/" className="footer-brand"><span className="brand-mark">K</span><span><strong>ANKIT KRYPTEX</strong><small>CREATE WITHOUT CLUTTER</small></span></Link>
      <span>© {new Date().getFullYear()} Kryptex Generator Hub</span>
      <span className="footer-links"><Link href="/ai">Ankit AI</Link><Link href="/video-studio">Video Studio</Link><a href="https://www.youtube.com/@Ankitkryptex" target="_blank" rel="noreferrer">YouTube</a></span>
    </footer>
  </main>;
}
