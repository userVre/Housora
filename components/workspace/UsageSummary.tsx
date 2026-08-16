"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const allowances: Record<string, number> = { free: 3, standard: 100, pro: 190, growth: 1200, scale: 2250, unlimited: 5250 };
export function useUsage() {
  const { user } = useUser();
  const subscription = useQuery(api.users.getSubscriptionStatus, user ? { clerkId: user.id } : "skip");
  const plan = subscription?.plan || "free";
  const allowance = allowances[plan] || 3;
  const remaining = subscription?.credits ?? null;
  return { loading: subscription === undefined, plan, allowance, remaining, used: remaining === null ? null : Math.max(0, allowance - remaining), status: subscription?.subscriptionStatus || "active", end: subscription?.subscriptionEnd };
}

export function UsageSummary({ compact = false }: { compact?: boolean }) {
  const usage = useUsage();
  if (compact) return <div className="workspace-home-usage"><span className="workspace-eyebrow">CURRENT PLAN</span><h2>{usage.plan}</h2><p>{usage.remaining === null ? "Loading your allowance…" : `${usage.remaining} images remaining (${usage.allowance} per cycle)`}</p><div className="workspace-home-usage-track"><span style={{ width: `${usage.used === null ? 0 : usage.used / usage.allowance * 100}%` }} /></div><a href="/app/plan">View plans and usage →</a></div>;
  const percent = usage.used === null ? 0 : Math.min(100, usage.used / usage.allowance * 100);
  return <><div className="workspace-usage-summary"><div className="workspace-usage-metric workspace-usage-metric-primary"><span>IMAGES REMAINING</span><strong>{usage.remaining ?? "—"}</strong><p>{usage.allowance} images per cycle</p></div><div className="workspace-usage-metric"><span>IMAGES USED</span><strong>{usage.used ?? "—"}</strong><p>Completed generations this cycle</p></div><div className="workspace-usage-metric"><span>PLAN ALLOWANCE</span><strong>{usage.allowance}</strong><p>Based on your current plan</p></div></div><div className="workspace-usage-panel"><div className="workspace-usage-panel-heading"><div><h2>Image usage</h2><p>Your allowance for the current billing cycle.</p></div><span>{Math.round(percent)}% used</span></div><div className="workspace-usage-large-track"><span style={{ width: `${percent}%` }} /></div></div></>;
}
