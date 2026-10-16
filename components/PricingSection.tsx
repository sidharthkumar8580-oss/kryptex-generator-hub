'use client';

import { useState } from 'react';

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayInstance = { open: () => void };
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayInstance } }

async function loadRazorpay() {
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const old = document.querySelector<HTMLScriptElement>('#razorpay-checkout-script');
    if (old) { old.addEventListener('load', () => resolve(!!window.Razorpay), { once: true }); old.addEventListener('error', () => resolve(false), { once: true }); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingSection() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [paid, setPaid] = useState(false);

  async function buyPremium() {
    setBusy(true); setMessage('');
    try {
      const orderResponse = await fetch('/api/billing/order', { method: 'POST' });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || 'Payment setup complete nahi hai.');
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error('Payment checkout load nahi hua. Internet connection check karo.');
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, name: 'Kryptex Generator Hub',
        description: 'Premium Video Generator — ₹99', order_id: order.orderId, theme: { color: '#a855f7' },
        handler: async (payment) => {
          try {
            const verify = await fetch('/api/billing/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payment) });
            const data = await verify.json();
            if (!verify.ok) throw new Error(data.error || 'Payment verify nahi ho paya.');
            setPaid(true); setMessage('Premium active hai. Video Generator try karo!');
          } catch (error) { setMessage(error instanceof Error ? error.message : 'Payment verify nahi ho paya.'); }
        },
        modal: { ondismiss: () => setMessage('Checkout close ho gaya. Koi payment complete nahi hui to dobara try kar sakte ho.') }
      });
      checkout.open();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Payment start nahi ho paya.'); }
    finally { setBusy(false); }
  }

  return <section id="pricing" className="pricing-section section-shell">
    <div className="pricing-glow" />
    <div className="pricing-copy"><div className="eyebrow">SIMPLE PRICING · NO CONFUSION</div><h2>Make more. <span className="gradient-text">Create better.</span></h2><p>Shuru karne ke liye free tools. Video generator ke liye ek simple premium plan.</p><div className="pricing-points"><span>✓ Free chat + image access</span><span>✓ 8 text generators</span><span>✓ Premium video job access</span></div></div>
    <div className="price-card"><div className="popular-pill">CREATOR PLAN</div><div className="price-line"><span>₹</span><strong>99</strong><small>/ access</small></div><p>One simple upgrade for Agnes video generation.</p><div className="price-divider" /><div className="plan-row"><span>✦</span><div><strong>Ankit Kryptex AI</strong><small>Text chat + image generation</small></div><b>Free*</b></div><div className="plan-row"><span>▶</span><div><strong>AI Video Generator</strong><small>5–12 second video jobs, model permitting</small></div><b>Premium</b></div><button className="button-primary full-width" type="button" disabled={busy || paid} onClick={buyPremium}>{busy ? <><span className="spinner" /> Preparing…</> : paid ? '✓ Premium Active' : 'Unlock Premium · ₹99'}</button>{message && <p className={paid ? 'success-note' : 'payment-note'} role="status">{message}</p>}<small className="legal-note">*Pollinations free/no-key endpoints are best-effort, may be rate-limited, and aren’t guaranteed unlimited. Payment only works after Razorpay is configured.</small></div>
  </section>;
}
