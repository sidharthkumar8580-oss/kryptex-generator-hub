# Kryptex Generator Hub — FINAL V3

**Tagline:** Ek Website, Saare Kaam + Apna AI  
**Brand/domain target:** Ankit Kryptex · `ankitkryptex.com`

A mobile-first Next.js + TypeScript + Tailwind project with a black glassmorphism UI and purple/pink gradients.

## What is included

- Landing page with Tools, Ankit Kryptex AI, Pricing ₹99, and channel link `https://www.youtube.com/@Ankitkryptex`.
- Ten generators: Shorts Script, Hook, Titles, Hashtags/SEO, Captions, Shayari, Story, Thumbnail Prompt, AI Image Creator, and premium Video Generator.
- `/ai`: full-page Ankit Kryptex AI interface with text chat and image requests.
- `/video-studio`: Agnes video workspace with prompt, duration and aspect-ratio controls, job polling, preview, download, and browser-based trim/export.
- Server-side Agnes video creation and status polling with signed premium-session protection.
- Razorpay order + signature verification routes for a ₹99 one-time order; a signed, HttpOnly premium cookie unlocks video after successful verified payment.
- Server-side-only API credentials via environment variables. **Never set secret keys under `NEXT_PUBLIC_*`, commit `.env.local`, or send API keys to the browser.**

## Run locally

Needs Node.js 20 LTS recommended.

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Netlify deployment

The production site is deployed through the connected GitHub repository on Netlify. Pushes merged into `master` trigger the production build. The current production deployment is available at:

- https://ankitkryptex.netlify.app
- https://ankitkryptex.com (custom domain, if DNS and domain mapping are active)

Configure these variables in Netlify Project configuration → Environment variables. Keep secrets server-side and enable Functions/Runtime scopes:

- `AGNES_API_KEY` — valid Agnes API key.
- `AGNES_VIDEO_MODEL` — defaults to `agnes-video-2.5-flash` in the app.
- `PREMIUM_SESSION_SECRET` — strong random server-side secret used to sign premium sessions.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` — required for real checkout and payment verification.
- `GROQ_API_KEY`, `OPENAI_API_KEY`, and `HF_TOKEN` — required only by the respective AI features/providers configured to use them.
- `NEXT_PUBLIC_SITE_URL` — public canonical site URL.

After changing environment variables, trigger a fresh Netlify build so deployed functions receive the updated values. Never commit actual credentials. Use payment-provider test credentials for testing; do not enable live payments until an adult account owner has reviewed the payment setup, pricing, terms, refund/cancellation information, privacy policy, and customer-support details.

## Useful routes

- `/` — home and generator tools
- `/ai` — Ankit Kryptex AI
- `/video-studio` — Agnes Video Studio
- `POST /api/image` — image generation backend
- `POST /api/generate` — text-generator backend
- `POST /api/video` — premium-gated Agnes video job creation
- `GET /api/video/status?videoId=...` — premium-gated status check
- `POST /api/video/download` — same-origin video download proxy
- `POST /api/billing/order` — creates a Razorpay order
- `POST /api/billing/verify` — verifies Razorpay signature and sets premium cookie

## Important notes

- A ₹99 payment does not guarantee third-party generation costs are covered for every request. Keep limits, usage monitoring, terms, and pricing aligned with actual provider pricing.
- Agnes availability, billing, limits, and output/audio properties are controlled by Agnes, not this app.
- Browser-based trimming uses FFmpeg.wasm on demand and may be memory-intensive on some phones; original video download remains available.
- Do not expose API credentials in client-side code or public repositories.
