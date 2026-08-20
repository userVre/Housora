"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { readConsent, writeConsent } from "@/lib/consent";

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const manageButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const consent = readConsent();
    setAnalytics(consent?.analytics ?? false);
    setOpen(!consent);
    const show = () => { const current = readConsent(); setAnalytics(current?.analytics ?? false); setOpen(true); setPreferencesOpen(true); };
    window.addEventListener("housora:open-cookie-settings", show);
    return () => window.removeEventListener("housora:open-cookie-settings", show);
  }, []);

  const save = (allowAnalytics: boolean) => {
    writeConsent(allowAnalytics);
    setPreferencesOpen(false);
    setOpen(false);
  };

  useEffect(() => {
    if (!preferencesOpen) return;
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])') ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setPreferencesOpen(false); manageButton.current?.focus(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preferencesOpen]);

  if (!open) return null;
  return (
    <><section className="cookiebot-panel cookiebot-banner" role="region" aria-labelledby="cookie-consent-title">
      <div className="cookiebot-desktop">
        <div className="cookiebot-content">
          <h2 className="cookiebot-title" id="cookie-consent-title">Your privacy choices</h2>
          <p className="cookiebot-message">Necessary storage keeps Housora secure. Analytics stays off unless you allow it. <Link href="/cookies">Cookie policy</Link></p>
        </div>
        <div className="cookiebot-actions">
          <button type="button" className="cookiebot-btn-choice" onClick={() => save(false)}>Reject analytics</button>
          <button type="button" className="cookiebot-btn-choice cookiebot-btn-primary" onClick={() => save(true)}>Accept analytics</button>
          <button ref={manageButton} type="button" className="cookiebot-btn-secondary" onClick={() => setPreferencesOpen(true)}>Manage choices</button>
        </div>
      </div>
    </section>{preferencesOpen && <div className="cookiebot-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreferencesOpen(false); }}><div className="cookiebot-preferences" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title" ref={dialog}>
      <div className="cookiebot-dialog-heading"><div><p className="cookiebot-eyebrow">PRIVACY PREFERENCES</p><h2 id="cookie-preferences-title">Manage your choices</h2></div><button type="button" className="icon-button" aria-label="Close privacy preferences" onClick={() => setPreferencesOpen(false)}>×</button></div>
      <p className="cookiebot-message">Choose whether Housora may use optional product analytics. You can change this at any time from Cookie settings in the footer.</p>
      <div className="cookiebot-toggles"><div className="cookiebot-toggle-row"><div className="cookiebot-toggle-copy"><strong>Necessary</strong><span>Authentication, security, consent memory, and requested product features.</span></div><span className="cookiebot-always-on">Always on</span></div><div className="cookiebot-toggle-row"><div className="cookiebot-toggle-copy"><label htmlFor="analytics-consent">Product analytics</label><span>Sanitized page views and selected product events through PostHog. No replay or click autocapture.</span></div><label className={`cookiebot-toggle ${analytics ? "active" : ""}`}><input id="analytics-consent" type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /><span className="cookiebot-toggle-slider" /></label></div></div>
      <Link href="/cookies" className="cookiebot-details-link">Read the Cookie &amp; Storage Policy</Link><div className="cookiebot-dialog-actions"><button type="button" className="cookiebot-btn-secondary" onClick={() => save(analytics)}>Save choices</button></div>
    </div></div>}</>
  );
}
