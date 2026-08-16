import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = { title: "Contact", description: "Contact Housora for product, billing, privacy, or account support." };
const topics = [["Product support", "Questions about uploads, generations, or projects."], ["Billing and refunds", "Include the email used at checkout and your receipt reference."], ["Privacy and account data", "Ask about access, correction, export, or deletion."], ["Enterprise", "Tell us about your team, expected volume, and workflow."]] as const;

export default function ContactPage() { return <SiteShell><section className="contact-page-section"><div className="contact-page-inner"><div className="contact-hero"><span className="section-eyebrow">SUPPORT</span><h1>How can we help?</h1><p>Send enough context for us to understand the request, but never email passwords, payment-card details, or private API keys.</p><a href="mailto:support@housora.app" className="btn-primary btn-large">EMAIL SUPPORT</a></div><div className="contact-options-grid">{topics.map(([title, copy]) => <article className="contact-option-card" key={title}><h2>{title}</h2><p>{copy}</p><a href={`mailto:support@housora.app?subject=${encodeURIComponent(`Housora ${title}`)}`}>support@housora.app →</a></article>)}</div></div></section></SiteShell>; }
