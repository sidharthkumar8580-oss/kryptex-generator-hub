# Kryptex Generator Hub — FINAL V3

**Tagline:** Ek Website, Saare Kaam + Apna AI  
**Brand/domain target:** Ankit Kryptex · `ankitkryptex.com`

A mobile-first Next.js 14 + TypeScript + Tailwind project with a black glassmorphism UI and purple/pink gradients. This follows the requested v14 stack; Next.js 14 is end-of-life, so upgrade to a supported Next.js major before a real public production launch.

## What is included

- Landing page with Tools, Ankit Kryptex AI, Pricing ₹99, and channel link `https://www.youtube.com/@Ankitkryptex`.
- Ten generators: Shorts Script, Hook, Titles, Hashtags/SEO, Captions, Shayari, Story, Thumbnail Prompt, AI Image Creator, and premium Video Generator.
- `/ai`: full-page ChatGPT-like Ankit Kryptex AI interface with text chat and image requests.
- Agnes asynchronous video creation/status polling using `agnes-video-2.5-flash` (current documented Agnes model ID), with premium-session protection.
- Razorpay order + signature verification routes for a ₹99 one-time order; a signed, HttpOnly premium cookie unlocks video after successful verified payment.
- Server-side-only API credentials via environment variables. **Never set secret keys under `NEXT_PUBLIC_*`, commit `.env.local`, or send API keys to the browser.**

## Run locally

Needs Node.js 18.17+ (Node 20 LTS recommended).

```bash
npm install
cp .env.example .env.local
```


To turn on Agnes videos, set `AGNES_API_KEY` to a valid **rotated/new** key in `.env.local`. Current documented model name is `agnes-video-2.5-flash`; `veo-3.0-flash` is not the model ID used in the current Agnes video API reference. Flash video supports 720P in the documented protocol. Provider availability, billing, limits, and output/audio properties are controlled by Agnes, not this app.

To accept actual ₹99 payments, configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from your Razorpay account. Payment is intentionally not simulated: when keys are missing, checkout returns a configuration message and premium access is not granted. Use Razorpay test keys while testing. Do not go live until the amount, plan terms, privacy policy, refund/cancellation information and customer support details are accurate.

Then:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

1. Upload the project to a private Git repository, without `.env.local` or secrets.
2. Import it into Vercel as a Next.js project.
3. Add all required environment variables in Vercel Project Settings → Environment Variables.
4. Deploy and set the custom domain in Vercel and at the domain registrar. Owning/configuring `ankitkryptex.com` is a separate step; the code does not register the domain automatically.

## Useful routes

- `/` — home and ten generator tools
- `/ai` — full-screen Ankit Kryptex AI
- `POST /api/image` — image prompt result
- `POST /api/generate` — text-generator backend
- `POST /api/video` — premium-gated Agnes video job creation
- `GET /api/video/status?videoId=...` — premium-gated status check
- `POST /api/billing/order` — creates a ₹99 Razorpay order
- `POST /api/billing/verify` — verifies Razorpay signature and sets premium cookie

## Important notes

- A ₹99 payment does not guarantee that third-party generation costs are covered for every request. Keep limits, usage monitoring, terms, and pricing aligned with actual provider pricing.
- The Agnes key pasted into the project brief has deliberately **not** been copied into any file. Treat it as exposed and revoke/rotate it before using the project.
- This repository includes the application code. It has not been deployed to or verified under `ankitkryptex.com`; configure environment variables and deploy it before sharing the site publicly.
