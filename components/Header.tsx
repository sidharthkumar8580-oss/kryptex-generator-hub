'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="Kryptex Studio home">
      <span className="brand-mark">✦</span>
      <span className="brand-copy"><strong>KRYPTEX STUDIO</strong><small>CREATE · EDIT · IMAGINE</small></span>
    </Link>
    <nav className="main-nav" aria-label="Main navigation">
      <Link className={pathname === '/' ? 'nav-link active' : 'nav-link'} href="/#tools">All tools</Link>
      <Link className={pathname === '/video-studio' ? 'nav-link active' : 'nav-link'} href="/video-studio">AI Video</Link>
      <Link className={pathname === '/ai' ? 'nav-link active' : 'nav-link'} href="/ai">AI Assistant</Link>
    </nav>
    <span className="nav-free"><i /> FREE ACCESS</span>
  </header>;
}
