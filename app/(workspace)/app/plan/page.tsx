import Link from "next/link";
import { SiteShell } from "@/components/layout/SiteShell";
import { UsageSummary } from "@/components/workspace/UsageSummary";
export default function PlanPage() { return <SiteShell workspace><section className="workspace-plan-page"><div className="workspace-home-heading"><div><span className="workspace-eyebrow">WORKSPACE</span><h1>Plan &amp; usage</h1><p>Review your current allowance and compare available plans.</p></div></div><UsageSummary compact /><div className="workspace-plan-actions"><Link href="/pricing" className="workspace-primary-action">Compare plans</Link><Link href="/pricing#billing-help">Billing and refund help</Link></div></section></SiteShell>; }
