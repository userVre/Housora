"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readConsent, writeConsent } from "@/lib/consent";

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = readConsent();
    setAnalytics(consent?.analytics ?? false);
    setOpen(!consent);
    const show = () => { const current = readConsent(); setAnalytics(current?.analytics ?? false); setOpen(true); };
    window.addEventListener("housora:open-cookie-settings", show);
    return () => window.removeEventListener("housora:open-cookie-settings", show);
  }, []);

  const save = (allowAnalytics: boolean) => {
    writeConsent(allowAnalytics);
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div className="cookiebot-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title" ref={dialog}>
      <div className="cookiebot-desktop">
        <div className="cookiebot-content">
          <p className="cookiebot-eyebrow">YOUR PRIVACY</p>
          <h2 className="cookiebot-title" id="cookie-consent-title">Choose how Housora uses analytics</h2>
          <p className="cookiebot-message">Necessary storage keeps sign-in and core features working. Optional analytics helps us improve the product and stays off unless you allow it.</p>
          <div className="cookiebot-toggles">
            <div className="cookiebot-toggle-row">
              <div className="cookiebot-toggle-copy"><strong>Necessary</strong><span>Authentication, security, consent memory, and requested product features.</span></div>
              <span className="cookiebot-always-on">Always on</span>
            </div>
            <div className="cookiebot-toggle-row">
              <div className="cookiebot-toggle-copy"><label htmlFor="analytics-consent">Product analytics</label><span>Sanitized page views and selected product events through PostHog. No replay or click autocapture.</span></div>
              <label className={`cookiebot-toggle ${analytics ? "active" : ""}`}><input id="analytics-consent" type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /><span className="cookiebot-toggle-slider" /></label>
            </div>
          </div>
          <Link href="/cookies" className="cookiebot-details-link">Read the Cookie &amp; Storage Policy</Link>
        </div>
        <div className="cookiebot-actions">
          <button type="button" className="cookiebot-btn-choice" onClick={() => save(false)}>Necessary only</button>
          <button type="button" className="cookiebot-btn-secondary" onClick={() => save(analytics)}>Save choices</button>
          <button type="button" className="cookiebot-btn-choice cookiebot-btn-primary" onClick={() => save(true)}>Accept all</button>
        </div>
      </div>
    </div>
  );
}
