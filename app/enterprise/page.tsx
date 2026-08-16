import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = { title: "Enterprise", description: "Higher-volume Housora plans for teams and larger projects." };
const tiers = [["Growth", "1,200", "€749"], ["Scale", "2,250", "€1,249"], ["Unlimited", "5,250", "€2,249"]] as const;

export default function EnterprisePage() { return <SiteShell><section className="enterprise-hero"><div className="enterprise-hero-inner"><span className="section-eyebrow">HOUSORA FOR TEAMS</span><h1>More room to create for larger projects</h1><p>Higher allowances, a clearer procurement path, and support for teams with repeat design workflows.</p><Link href="/contact" className="btn-primary btn-large">TALK TO US</Link></div></section><section className="pricing-section"><div className="pricing-grid enterprise-pricing-grid">{tiers.map(([name, images, price]) => <article className="pricing-card" key={name}><span className="pricing-plan-name">{name}</span><div className="price-current">{price}</div><p>{images} images per billing cycle</p><ul className="pricing-features"><li>Commercial project use</li><li>Private project workspace</li><li>Priority support</li><li>Centralized billing assistance</li></ul><Link href="/contact" className="pricing-btn">CONTACT SALES</Link></article>)}</div></section></SiteShell>; }
