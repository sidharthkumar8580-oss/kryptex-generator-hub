import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import AnkitAIFloatingButton from '@/components/AnkitAIFloatingButton';

export const metadata: Metadata = {
  title: 'Kryptex Generator Hub — Ek Website, Saare Kaam + Apna AI',
  description: 'Ankit Kryptex ka creative workspace: Hindi Shorts scripts, hooks, titles, captions, thumbnail prompts, AI chat, image generation aur premium video tools.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ankitkryptex.com'),
  applicationName: 'Kryptex Generator Hub',
  openGraph: {
    title: 'Kryptex Generator Hub',
    description: 'Ek Website, Saare Kaam + Apna AI',
    url: 'https://ankitkryptex.com',
    siteName: 'Kryptex Generator Hub',
    type: 'website'
  }
};
export const viewport: Viewport = { themeColor: '#0a0a0a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Header />{children}<AnkitAIFloatingButton /></body></html>;
}
