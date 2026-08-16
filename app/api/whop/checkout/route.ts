import { onRequestOptions, onRequestPost } from "@/functions/api/whop/checkout.js";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return onRequestOptions({ request, env: process.env }); }
const planEnvironmentKeys = {
  "standard-monthly": "WHOP_STANDARD_MONTHLY_PLAN_ID",
  "standard-yearly": "WHOP_STANDARD_YEARLY_PLAN_ID",
  "pro-monthly": "WHOP_PRO_MONTHLY_PLAN_ID",
  "pro-yearly": "WHOP_PRO_YEARLY_PLAN_ID",
} as const;

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as {
    planId?: string;
    termsAccepted?: boolean;
    immediatePerformanceRequested?: boolean;
    legalVersion?: string;
  } | null;
  const environmentKey = input?.planId && input.planId in planEnvironmentKeys
    ? planEnvironmentKeys[input.planId as keyof typeof planEnvironmentKeys]
    : null;
  const planId = environmentKey ? process.env[environmentKey] : "";
  if (!planId) return Response.json({ error: "The selected plan is not configured." }, { status: 503 });
  const body = new URLSearchParams({
    planId,
    termsAccepted: String(input?.termsAccepted === true),
    immediatePerformanceRequested: String(input?.immediatePerformanceRequested === true),
    legalVersion: input?.legalVersion || "",
  });
  const forwarded = new Request(request.url, {
    method: "POST",
    headers: new Headers(request.headers),
    body,
  });
  forwarded.headers.set("Content-Type", "application/x-www-form-urlencoded");
  return onRequestPost({ request: forwarded, env: process.env });
}
