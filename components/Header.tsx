'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Kryptex Generator Hub home">
        <span className="brand-mark">K</span>
        <span className="brand-copy"><strong>ANKIT KRYPTEX</strong><small>GENERATOR HUB</small></span>
      </Link>
      <nav className="main-nav" aria-label="Main navigation">
        <Link className={pathname === '/' ? 'nav-link active' : 'nav-link'} href="/#tools">Tools</Link>
        <Link className={pathname === '/ai' ? 'nav-link active' : 'nav-link'} href="/ai">Ankit Kryptex AI</Link>
      </nav>
      <Link className="nav-price" href="/#pricing"><span className="spark-small">✦</span> Pricing <b>₹99</b></Link>
    </header>
  );
}
