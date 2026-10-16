'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AnkitAIFloatingButton() {
  const pathname = usePathname();
  if (pathname === '/ai') return null;
  return <Link className="floating-ai" href="/ai"><span>✦</span><span>Ask Ankit AI</span><i aria-hidden="true" /></Link>;
}
