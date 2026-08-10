import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * Verify Whop webhook signature using HMAC-SHA256.
 * Uses the WHOP_WEBHOOK_SECRET env var (NOT WHOP_API_KEY).
 */
async function verifyWebhookSignature(
  body: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const signature = headers.get("webhook-signature");
  if (!webhookId || !webhookTimestamp || !signature) return false;
  try {
    const encoder = new TextEncoder();
    const timestamp = Number(webhookTimestamp);
    if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
    const signed = encoder.encode(`${webhookId}.${webhookTimestamp}.${body}`);
    const secretValue = secret.replace(/^whsec_/, "");
    let secretBytes: Uint8Array;
    try {
      const decoded = atob(secretValue);
      secretBytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    } catch (_) {
      secretBytes = encoder.encode(secret);
    }
    const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    for (const candidate of signature.split(" ")) {
      const [version, value] = candidate.split(",", 2);
      if (version !== "v1" || !value) continue;
      const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
      if (await crypto.subtle.verify("HMAC", key, bytes, signed)) return true;
    }
    return false;
  } catch (e) {
    console.error("[Whop Webhook] Signature verification error:", e);
    return false;
  }
}

// Whop webhook endpoint
http.route({
  path: "/api/webhooks/whop",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // === CRITICAL: Reject if webhook secret is not configured ===
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.trim() === "") {
      console.error("[Whop Webhook] WHOP_WEBHOOK_SECRET is empty or not configured. Rejecting webhook.");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.text();

    // === Verify HMAC-SHA256 signature ===
    const isValid = await verifyWebhookSignature(body, request.headers, webhookSecret);
    if (!isValid) {
      console.error("[Whop Webhook] Invalid signature. Rejecting webhook.");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let event: any;
    try {
      event = JSON.parse(body);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const eventType = String(event.type || event.event || "").trim();
    const eventData = event.data;

    if (!eventType || !eventData) {
      return new Response(JSON.stringify({ error: "Missing event or data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // === IDEMPOTENCY: Extract event ID for duplicate detection ===
    const eventId = event.id || eventData.id || null;
    console.log(`[Whop Webhook] Received verified event: ${eventType} (id: ${eventId || "none"})`);

    try {
      switch (eventType) {
        case "payment.succeeded":
          await handleCheckoutCompleted(ctx, eventData);
          break;
        case "membership.activated":
        case "invoice.paid":
          await handleSubscriptionActive(ctx, eventData);
          break;
        case "membership.deactivated":
          await handleSubscriptionCanceled(ctx, eventData);
          break;
        case "payment.failed":
        case "invoice.past.due":
          await handlePaymentFailed(ctx, eventData);
          break;
        case "membership.cancel_at_period_end_changed":
          await handleSubscriptionCancelAtPeriodEnd(ctx, eventData);
          break;
        case "refund.created":
        case "dispute.created":
          console.log(`[Whop Webhook] Financial event received: ${eventType}`);
          break;
        default:
          console.log(`[Whop Webhook] Unhandled event type: ${eventType}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error(`[Whop Webhook] Error processing ${eventType}:`, error?.message || error);
      return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Helper: Map Whop plan ID to internal plan name
function mapPlanIdToName(planId: string): string {
  const planMap: Record<string, string> = {
    [process.env.WHOP_STANDARD_MONTHLY_PLAN_ID || ""]: "standard",
    [process.env.WHOP_STANDARD_YEARLY_PLAN_ID || ""]: "standard",
    [process.env.WHOP_PRO_MONTHLY_PLAN_ID || ""]: "pro",
    [process.env.WHOP_PRO_YEARLY_PLAN_ID || ""]: "pro",
    [process.env.WHOP_ENTREPRISE_STARTER_MONTHLY_PLAN_ID || ""]: "growth",
    [process.env.WHOP_ENTREPRISE_STARTER_YEARLY_PLAN_ID || ""]: "growth",
    [process.env.WHOP_ENTREPRISE_PLUS_MONTHLY_PLAN_ID || ""]: "scale",
    [process.env.WHOP_ENTREPRISE_PLUS_YEARLY_PLAN_ID || ""]: "scale",
    [process.env.WHOP_ENTREPRISE_PRO_MONTHLY_PLAN_ID || ""]: "unlimited",
    [process.env.WHOP_ENTREPRISE_PRO_YEARLY_PLAN_ID || ""]: "unlimited",
    [process.env.WHOP_ENTREPRISE_MAX_YEARLY_PLAN_ID || ""]: "unlimited",
  };
  return planMap[planId] || "free";
}

// Helper: Get credits for plan
function getCreditsForPlan(plan: string): number {
  const credits: Record<string, number> = {
    free: 5,
    standard: 650,
    pro: 1250,
    growth: 1200,
    scale: 2250,
    unlimited: 5250,
  };
  return credits[plan] ?? 5;
}

/**
 * Extract clerkId from signed Whop event data ONLY.
 * NEVER trust clerkId sent from browser form data.
 * The clerkId must come from Whop's signed checkout metadata (client_reference_id or metadata).
 */
function extractClerkId(data: any): string | null {
  // Whop passes client_reference_id in checkout.completed events
  const clerkId = data.client_reference_id
    || data.user?.clerk_id
    || data.metadata?.clerk_id;
  return clerkId || null;
}

async function handleCheckoutCompleted(ctx: any, data: any) {
  // clerkId comes ONLY from the signed Whop event (client_reference_id or metadata)
  const clerkId = extractClerkId(data);
  const whopCustomerId = data.customer_id;
  const whopSubscriptionId = data.subscription_id || data.id;
  const planId = data.plan_id || data.product_id;

  if (!clerkId) {
    console.error("[Whop] checkout.completed: No clerk_id found in signed event data (client_reference_id or metadata)");
    return;
  }

  const plan = mapPlanIdToName(planId);
  const credits = getCreditsForPlan(plan);

  console.log(`[Whop] checkout.completed: clerkId=${clerkId.slice(0, 8)}... plan=${plan}`);

  const user = await ctx.runQuery(api.users.getCurrentUser, { clerkId });
  if (user) {
    // === IDEMPOTENCY: Skip if user already has this plan ===
    if (user.plan === plan && user.subscriptionStatus !== "canceled" && user.subscriptionStatus !== "expired") {
      console.log(`[Whop] checkout.completed: User ${clerkId.slice(0, 8)}... already has plan ${plan}, skipping`);
      return;
    }
    await ctx.runMutation(api.users.handleSubscriptionActivated, {
      clerkId,
      plan: plan as any,
      credits,
      whopCustomerId: whopCustomerId || undefined,
      whopSubscriptionId: whopSubscriptionId || undefined,
    });
    console.log(`[Whop] Existing user ${clerkId.slice(0, 8)}... activated plan: ${plan}`);
  } else {
    // Create new user with this plan
    await ctx.runMutation(api.users.createOrUpdateUser, {
      clerkId,
      email: data.user?.email || "",
      name: data.user?.name || undefined,
    });
    await ctx.runMutation(api.users.handleSubscriptionActivated, {
      clerkId,
      plan: plan as any,
      credits,
      whopCustomerId: whopCustomerId || undefined,
      whopSubscriptionId: whopSubscriptionId || undefined,
    });
    console.log(`[Whop] New user ${clerkId.slice(0, 8)}... created with plan: ${plan}`);
  }
}

async function handleSubscriptionActive(ctx: any, data: any) {
  const clerkId = extractClerkId(data);
  const subscriptionId = data.id;
  const planId = data.plan_id;

  if (!clerkId) {
    console.error("[Whop] subscription.active: No clerk_id in signed event");
    return;
  }

  const plan = mapPlanIdToName(planId);
  const credits = getCreditsForPlan(plan);

  // === IDEMPOTENCY: Check current state before mutating ===
  const user = await ctx.runQuery(api.users.getCurrentUser, { clerkId });
  if (user && user.plan === plan && user.subscriptionStatus === "active") {
    console.log(`[Whop] subscription.active: User ${clerkId.slice(0, 8)}... already active on ${plan}, skipping`);
    return;
  }

  await ctx.runMutation(api.users.handleSubscriptionActivated, {
    clerkId,
    plan: plan as any,
    credits,
    whopSubscriptionId: subscriptionId || undefined,
  });
  console.log(`[Whop] Subscription active for ${clerkId.slice(0, 8)}...: ${plan}`);
}

async function handleSubscriptionCanceled(ctx: any, data: any) {
  const clerkId = extractClerkId(data);
  if (!clerkId) {
    console.error("[Whop] subscription.canceled: No clerk_id in signed event");
    return;
  }

  // === IDEMPOTENCY: Skip if already canceled ===
  const user = await ctx.runQuery(api.users.getCurrentUser, { clerkId });
  if (user && user.subscriptionStatus === "canceled") {
    console.log(`[Whop] subscription.canceled: User ${clerkId.slice(0, 8)}... already canceled, skipping`);
    return;
  }

  await ctx.runMutation(api.users.handleSubscriptionCanceled, { clerkId });
  console.log(`[Whop] Subscription canceled for ${clerkId.slice(0, 8)}...`);
}

function extractSubscriptionEnd(data: any): number | undefined {
  const value = data.end_date || data.current_period_end || data.renewal_end || data.expires_at;
  if (typeof value === "number") return value < 100000000000 ? value * 1000 : value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric < 100000000000 ? numeric * 1000 : numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

async function handleSubscriptionCancelAtPeriodEnd(ctx: any, data: any) {
  const clerkId = extractClerkId(data);
  if (!clerkId) {
    console.error("[Whop] cancellation schedule: No clerk_id in signed event");
    return;
  }
  await ctx.runMutation(api.users.handleSubscriptionCancelAtPeriodEnd, {
    clerkId,
    subscriptionEnd: extractSubscriptionEnd(data),
  });
  console.log(`[Whop] Cancellation scheduled for ${clerkId.slice(0, 8)}...`);
}

async function handleSubscriptionExpired(ctx: any, data: any) {
  const clerkId = extractClerkId(data);
  if (!clerkId) {
    console.error("[Whop] subscription.expired: No clerk_id in signed event");
    return;
  }

  // === IDEMPOTENCY: Skip if already expired ===
  const user = await ctx.runQuery(api.users.getCurrentUser, { clerkId });
  if (user && user.subscriptionStatus === "expired") {
    console.log(`[Whop] subscription.expired: User ${clerkId.slice(0, 8)}... already expired, skipping`);
    return;
  }

  await ctx.runMutation(api.users.handleSubscriptionExpired, { clerkId });
  console.log(`[Whop] Subscription expired for ${clerkId.slice(0, 8)}...`);
}

async function handlePaymentFailed(ctx: any, data: any) {
  const clerkId = extractClerkId(data);
  if (!clerkId) {
    console.error("[Whop] subscription.payment_failed: No clerk_id in signed event");
    return;
  }

  // === IDEMPOTENCY: Skip if already in payment_failed state ===
  const user = await ctx.runQuery(api.users.getCurrentUser, { clerkId });
  if (user && user.subscriptionStatus === "payment_failed") {
    console.log(`[Whop] subscription.payment_failed: User ${clerkId.slice(0, 8)}... already flagged, skipping`);
    return;
  }

  await ctx.runMutation(api.users.handleSubscriptionPaymentFailed, { clerkId });
  console.log(`[Whop] Payment failed for ${clerkId.slice(0, 8)}...`);
}

async function handleSubscriptionPending(ctx: any, data: any) {
  const clerkId = extractClerkId(data);
  if (!clerkId) {
    console.error("[Whop] subscription.pending: No clerk_id in signed event");
    return;
  }

  // === IDEMPOTENCY: Skip if already pending ===
  const user = await ctx.runQuery(api.users.getCurrentUser, { clerkId });
  if (user && user.subscriptionStatus === "pending") {
    console.log(`[Whop] subscription.pending: User ${clerkId.slice(0, 8)}... already pending, skipping`);
    return;
  }

  await ctx.runMutation(api.users.handleSubscriptionPending, { clerkId });
  console.log(`[Whop] Subscription pending for ${clerkId.slice(0, 8)}...`);
}

export default http;
