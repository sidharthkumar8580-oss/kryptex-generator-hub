import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { ink: '#0a0a0a', violetGlow: '#9333ea', pinkGlow: '#ec4899' }, boxShadow: { glow: '0 0 40px rgba(147, 51, 234, .18)' } } },
  plugins: []
};
export default config;
