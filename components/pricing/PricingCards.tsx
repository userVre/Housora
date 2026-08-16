"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useAnalytics } from "@/components/privacy/AnalyticsProvider";
import { readConsent } from "@/lib/consent";

const plans = [
  { name: "Standard", images: 100, monthly: "€19", yearly: "€190", monthlyId: "standard-monthly", yearlyId: "standard-yearly", featured: false },
  { name: "Pro", images: 190, monthly: "€29", yearly: "€290", monthlyId: "pro-monthly", yearlyId: "pro-yearly", featured: true },
] as const;

export function PricingCards() {
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { getToken, isSignedIn } = useAuth();
  const { capture } = useAnalytics();

  const checkout = async (plan: typeof plans[number]) => {
    if (!isSignedIn) { window.location.assign("/sign-up?redirect=/pricing"); return; }
    setLoading(plan.name); setError("");
    capture("checkout_started", { billing_period: yearly ? "yearly" : "monthly" });
    try {
      const token = await getToken();
      const consent = readConsent();
      const response = await fetch("/api/whop/checkout", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Housora-Analytics-Consent": consent?.analytics ? `v3;analytics=1;timestamp=${consent.timestamp}` : "v3;analytics=0" }, body: JSON.stringify({ planId: yearly ? plan.yearlyId : plan.monthlyId, termsAccepted: true, immediatePerformanceRequested: true, legalVersion: "2026-08-13" }) });
      const result = await response.json() as { url?: string; error?: string | { message?: string } };
      const serverError = typeof result.error === "string" ? result.error : result.error?.message;
      if (!response.ok || !result.url) throw new Error(serverError || "Checkout is temporarily unavailable.");
      capture("checkout_redirected"); window.location.assign(result.url);
    } catch (checkoutError) { setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is temporarily unavailable."); capture("checkout_failed", { error_code: "request_failed" }); }
    finally { setLoading(null); }
  };

  return <><div className="pricing-toggle"><button className={!yearly ? "active" : ""} onClick={() => setYearly(false)}>Monthly</button><button className={yearly ? "active" : ""} onClick={() => setYearly(true)}>Yearly <span>Save 2 months</span></button></div><div className="pricing-grid">{plans.map((plan) => <article className={`pricing-card ${plan.featured ? "featured" : ""}`} key={plan.name}>{plan.featured && <span className="pricing-popular">MOST POPULAR</span>}<h2 className="pricing-plan-name">{plan.name}</h2><div className="price-current">{yearly ? plan.yearly : plan.monthly}</div><p>{yearly ? "per year" : "per month"}</p><strong>{plan.images} images per cycle</strong><ul className="pricing-features"><li>All Housora design tools</li><li>Private project history</li><li>Commercial-use concepts</li><li>Cancel future renewals through Whop</li></ul><button className="pricing-btn" disabled={loading !== null} onClick={() => void checkout(plan)}>{loading === plan.name ? "OPENING CHECKOUT…" : `CHOOSE ${plan.name.toUpperCase()}`}</button></article>)}</div>{error && <p className="pricing-error" role="alert">{error}</p>}</>;
}
