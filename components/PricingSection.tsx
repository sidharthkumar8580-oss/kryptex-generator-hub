export default function PricingSection() {
  return <section id="pricing" className="pricing-section section-shell">
    <div className="pricing-glow" />
    <div className="pricing-copy">
      <div className="eyebrow">TEMPORARILY FREE · CREATOR ACCESS</div>
      <h2>Make more. <span className="gradient-text">Create better.</span></h2>
      <p>Abhi ke liye Kryptex ke video generation aur editing tools free access ke saath available hain.</p>
      <div className="pricing-points">
        <span>✓ Free chat + image access</span>
        <span>✓ 8 text generators</span>
        <span>✓ AI video generation + basic trim editor</span>
      </div>
    </div>
    <div className="price-card">
      <div className="popular-pill">TEMPORARY FREE ACCESS</div>
      <div className="price-line"><span>₹</span><strong>0</strong><small>/ abhi</small></div>
      <p>Use the creator tools while temporary free access is enabled.</p>
      <div className="price-divider" />
      <div className="plan-row"><span>✦</span><div><strong>Ankit Kryptex AI</strong><small>Text chat + image generation</small></div><b>Free</b></div>
      <div className="plan-row"><span>▶</span><div><strong>AI Video Generator</strong><small>Agnes video jobs · 5–12 seconds</small></div><b>Free</b></div>
      <div className="plan-row"><span>✂</span><div><strong>Video Editor</strong><small>Basic trim and export in browser</small></div><b>Free</b></div>
      <a className="button-primary full-width" href="/video-studio">Open Video Studio ↗</a>
      <small className="legal-note">Free access is temporary. Video generation depends on Agnes API availability and may have provider-side limits.</small>
    </div>
  </section>;
}
