import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { PricingCards } from "@/components/pricing/PricingCards";

export const metadata: Metadata = { title: "Pricing", description: "Compare Housora plans, image allowances, billing periods, and purchase terms." };
export default function PricingPage() { return <SiteShell><section className="pricing-hero"><div className="pricing-hero-inner"><span className="section-eyebrow">SIMPLE PLANS</span><h1>Choose room for the ideas you want to explore</h1><p>Allowances reset each billing cycle. Final price, renewal terms, and applicable taxes are confirmed in Whop checkout.</p></div></section><section className="pricing-section"><PricingCards /></section><section className="pricing-help" id="billing-help"><h2>Billing and refund help</h2><p>Manage renewals from your Whop purchase. For assistance, email support@housora.app with your account email and receipt reference.</p></section></SiteShell>; }
