import type { Metadata, Viewport } from 'next';
import './globals.css';
import Script from 'next/script';
import Header from '@/components/Header';
import AnkitAIFloatingButton from '@/components/AnkitAIFloatingButton';
import VoiceAssistant from '@/components/VoiceAssistant';

export const metadata: Metadata = {
  title: 'Kryptex Studio — Create, Edit, Imagine',
  description: 'Kryptex Studio: AI video creation, photo and video editing, creator tools and voice assistant.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ankitkryptex.com'),
  applicationName: 'Kryptex Studio',
  openGraph: {
    title: 'Kryptex Studio',
    description: 'Create, edit and imagine in one workspace',
    url: 'https://ankitkryptex.com',
    siteName: 'Kryptex Studio',
    type: 'website'
  }
};
export const viewport: Viewport = { themeColor: '#0a0a0a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
  <Script
    src="https://www.googletagmanager.com/gtag/js?id=G-KYEHWR4HRZ"
    strategy="afterInteractive"
  />
  <Script id="google-analytics" strategy="afterInteractive">
    {`window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-KYEHWR4HRZ');`}
  </Script>
  <Header />{children}<AnkitAIFloatingButton /><VoiceAssistant />
</body></html>;
}
