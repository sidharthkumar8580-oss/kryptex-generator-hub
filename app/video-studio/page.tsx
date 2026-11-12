import type { Metadata } from 'next';
import VideoStudio from '@/components/VideoStudio';
import './video-studio.css';

export const metadata: Metadata = {
  title: 'Agnes Video Studio — Kryptex Generator Hub',
  description: 'Create, preview, download and trim AI videos with Agnes in Kryptex Generator Hub.'
};

export default function VideoStudioPage() {
  return <VideoStudio />;
}
