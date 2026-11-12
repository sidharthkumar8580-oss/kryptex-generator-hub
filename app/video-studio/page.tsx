import type { Metadata } from 'next';
import VideoStudio from '@/components/VideoStudio';
import './video-studio.css';

export const metadata: Metadata = {
  title: 'AI Video Studio — Kryptex Studio',
  description: 'Generate AI videos and edit clips in Kryptex Studio.'
};

export default function VideoStudioPage() {
  return <VideoStudio />;
}
