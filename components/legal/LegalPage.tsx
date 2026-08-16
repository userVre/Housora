import { SiteShell } from "@/components/layout/SiteShell";

export type LegalSection = { heading: string; paragraphs: string[]; items?: string[] };
export function LegalPage({ title, updated = "15 August 2026", sections }: { title: string; updated?: string; sections: LegalSection[] }) {
  return <SiteShell><article className="legal-page"><header className="legal-header"><span className="section-eyebrow">HOUSORA LEGAL</span><h1>{title}</h1><p>Last updated: {updated}</p></header><div className="legal-content">{sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}<section><h2>Contact</h2><p>Questions or privacy requests can be sent to support@housora.app. Never include passwords, private API keys, or payment-card details.</p></section></div></article></SiteShell>;
}
