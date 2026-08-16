import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";

export default function NotFound() {
  return <SiteShell><section className="faq-page-section"><div className="faq-page-inner"><h1 className="faq-page-title">Page not found</h1><p className="faq-page-subtitle">The page may have moved or no longer exists.</p><Link href="/" className="btn-primary btn-large">Return home</Link></div></section></SiteShell>;
}
