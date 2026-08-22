import { httpRouter } from "convex/server";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { env, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { PaidPlan } from "./lib/plans";

const http = httpRouter();
const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const MAX_GENERATION_CALLBACK_BODY_BYTES = 16 * 1024;

type JsonRecord = Record<string, unknown>;
type SubscriptionEvent =
  | "payment.succeeded"
  | "membership.activated"
  | "invoice.paid"
  | "membership.deactivated"
  | "membership.expired"
  | "payment.failed"
  | "invoice.past.due"
  | "membership.cancel_at_period_end_changed"
  | "membership.pending";

const SUBSCRIPTION_EVENTS = new Set<string>([
  "payment.succeeded",
  "membership.activated",
  "invoice.paid",
  "membership.deactivated",
  "membership.expired",
  "payment.failed",
  "invoice.past.due",
  "membership.cancel_at_period_end_changed",
  "membership.pending",
]);

function jsonResponse(status: number, payload: JsonRecord): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function nestedRecord(record: JsonRecord, key: string): JsonRecord | null {
  return asRecord(record[key]);
}

function extractClerkId(data: JsonRecord): string | null {
  const user = nestedRecord(data, "user");
  const metadata = nestedRecord(data, "metadata");
  return optionalString(data.client_reference_id)
    ?? optionalString(user?.clerk_id)
    ?? optionalString(metadata?.clerk_id)
    ?? null;
}

function extractEmail(data: JsonRecord): string | undefined {
  return optionalString(nestedRecord(data, "user")?.email);
}

function extractName(data: JsonRecord): string | undefined {
  return optionalString(nestedRecord(data, "user")?.name);
}

function normalizeTimestamp(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value < 100_000_000_000 ? value * 1000 : value);
  }
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return Math.trunc(numeric < 100_000_000_000 ? numeric * 1000 : numeric);
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

type PlanSelection = { plan: PaidPlan; billingInterval: "monthly" | "yearly" };

// `convex codegen` updates Env after the next Convex deploy. Keep the aliases
// typed here too so local verification works before that deployment.
type CheckoutPlanEnvironment = typeof env & {
  readonly WHOP_PLAN_STANDARD_MONTHLY?: string;
  readonly WHOP_PLAN_STANDARD_YEARLY?: string;
  readonly WHOP_PLAN_PRO_MONTHLY?: string;
  readonly WHOP_PLAN_PRO_YEARLY?: string;
  readonly WHOP_PLAN_ENTERPRISE_MONTHLY?: string;
  readonly WHOP_PLAN_ENTERPRISE_YEARLY?: string;
};
const checkoutPlanEnvironment = env as CheckoutPlanEnvironment;

function mapPlanIdToName(planId: string | undefined): PlanSelection | null {
  if (!planId) return null;
  const configuredPlans: Array<[string | undefined, PlanSelection]> = [
    [env.WHOP_STANDARD_MONTHLY_PLAN_ID, { plan: "standard", billingInterval: "monthly" }],
    [checkoutPlanEnvironment.WHOP_PLAN_STANDARD_MONTHLY, { plan: "standard", billingInterval: "monthly" }],
    [env.WHOP_STANDARD_YEARLY_PLAN_ID, { plan: "standard", billingInterval: "yearly" }],
    [checkoutPlanEnvironment.WHOP_PLAN_STANDARD_YEARLY, { plan: "standard", billingInterval: "yearly" }],
    [env.WHOP_PRO_MONTHLY_PLAN_ID, { plan: "pro", billingInterval: "monthly" }],
    [checkoutPlanEnvironment.WHOP_PLAN_PRO_MONTHLY, { plan: "pro", billingInterval: "monthly" }],
    [env.WHOP_PRO_YEARLY_PLAN_ID, { plan: "pro", billingInterval: "yearly" }],
    [checkoutPlanEnvironment.WHOP_PLAN_PRO_YEARLY, { plan: "pro", billingInterval: "yearly" }],
    [env.WHOP_ENTREPRISE_STARTER_MONTHLY_PLAN_ID, { plan: "growth", billingInterval: "monthly" }],
    [checkoutPlanEnvironment.WHOP_PLAN_ENTERPRISE_MONTHLY, { plan: "growth", billingInterval: "monthly" }],
    [env.WHOP_ENTREPRISE_STARTER_YEARLY_PLAN_ID, { plan: "growth", billingInterval: "yearly" }],
    [checkoutPlanEnvironment.WHOP_PLAN_ENTERPRISE_YEARLY, { plan: "growth", billingInterval: "yearly" }],
    [env.WHOP_ENTREPRISE_PLUS_MONTHLY_PLAN_ID, { plan: "scale", billingInterval: "monthly" }],
    [env.WHOP_ENTREPRISE_PLUS_YEARLY_PLAN_ID, { plan: "scale", billingInterval: "yearly" }],
    [env.WHOP_ENTREPRISE_PRO_MONTHLY_PLAN_ID, { plan: "unlimited", billingInterval: "monthly" }],
    [env.WHOP_ENTREPRISE_PRO_YEARLY_PLAN_ID, { plan: "unlimited", billingInterval: "yearly" }],
    [env.WHOP_ENTREPRISE_MAX_YEARLY_PLAN_ID, { plan: "unlimited", billingInterval: "yearly" }],
  ];
  return configuredPlans.find(([configured]) => configured?.trim() === planId)?.[1] ?? null;
}

async function verifyWebhookSignature(
  body: string,
  headers: Headers,
  secret: string,
): Promise<boolean> {
  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const signature = headers.get("webhook-signature");
  if (!webhookId || webhookId.length > 256 || !webhookTimestamp || !signature) return false;

  try {
    const timestamp = Number(webhookTimestamp);
    if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
      return false;
    }
    const encoder = new TextEncoder();
    const signed = encoder.encode(`${webhookId}.${webhookTimestamp}.${body}`);
    const encodedSecret = secret.replace(/^whsec_/, "");
    let secretBytes: Uint8Array;
    try {
      secretBytes = Uint8Array.from(atob(encodedSecret), (char) => char.charCodeAt(0));
    } catch {
      secretBytes = encoder.encode(secret);
    }
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes.buffer as ArrayBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    for (const candidate of signature.split(" ")) {
      const [version, value] = candidate.split(",", 2);
      if (version !== "v1" || !value) continue;
      const bytes = Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
      if (await crypto.subtle.verify(
        "HMAC",
        key,
        bytes.buffer as ArrayBuffer,
        signed.buffer as ArrayBuffer,
      )) return true;
    }
    return false;
  } catch (error) {
    console.error("[Whop Webhook] Signature verification failed", error);
    return false;
  }
}

async function processSubscriptionEvent(
  ctx: ActionCtx,
  eventId: string,
  eventCreatedAt: number,
  eventType: SubscriptionEvent,
  data: JsonRecord,
): Promise<string> {
  const clerkId = extractClerkId(data);
  if (!clerkId) throw new Error("Signed event is missing clerk_id metadata");

  const activation = eventType === "payment.succeeded"
    || eventType === "membership.activated"
    || eventType === "invoice.paid";
  const planId = optionalString(data.plan_id) ?? optionalString(data.product_id);
  const plan = mapPlanIdToName(planId);
  if (activation && !plan) throw new Error("Signed event references an unknown plan");

  const result: string = await ctx.runMutation(internal.subscriptions.processWhopEvent, {
    eventId,
    eventCreatedAt,
    eventType,
    clerkId,
    email: extractEmail(data),
    name: extractName(data),
    plan: plan?.plan,
    billingInterval: plan?.billingInterval,
    whopCustomerId: optionalString(data.customer_id),
    whopSubscriptionId: optionalString(data.subscription_id) ?? optionalString(data.id),
    subscriptionEnd: normalizeTimestamp(
      data.end_date ?? data.current_period_end ?? data.renewal_end ?? data.expires_at,
    ),
  });
  return result;
}

http.route({
  path: "/api/internal/generations/transition",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const callbackSecret = env.GENERATION_CALLBACK_SECRET?.trim();
    if (!callbackSecret) {
      console.error("[Generation Callback] GENERATION_CALLBACK_SECRET is not configured");
      return jsonResponse(500, { error: "Generation callback not configured" });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_GENERATION_CALLBACK_BODY_BYTES) {
      return jsonResponse(413, { error: "Callback body is too large" });
    }
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_GENERATION_CALLBACK_BODY_BYTES) {
      return jsonResponse(413, { error: "Callback body is too large" });
    }
    if (!(await verifyWebhookSignature(body, request.headers, callbackSecret))) {
      return jsonResponse(401, { error: "Invalid signature" });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body) as unknown;
    } catch {
      return jsonResponse(400, { error: "Invalid JSON" });
    }
    const callback = asRecord(parsed);
    const eventId = request.headers.get("webhook-id")?.trim();
    const generationId = callback ? optionalString(callback.generationId) : undefined;
    const transition = callback ? optionalString(callback.transition) : undefined;
    if (!eventId || !transition || (transition !== "reserve" && (!generationId || generationId.length > 256))) {
      return jsonResponse(400, { error: "Missing callback fields" });
    }

    try {
      if (transition === "reserve") {
        const clerkId = optionalString(callback?.clerkId);
        if (!clerkId || clerkId.length > 256) {
          return jsonResponse(400, { error: "Invalid account identifier" });
        }
        const reservation = await ctx.runMutation(internal.users.deductCredits, {
          eventId,
          clerkId,
          amount: 1,
          toolType: "design",
        });
        return jsonResponse(200, { received: true, reservation });
      }
      const typedGenerationId = generationId as Id<"generations">;
      if (transition === "processing") {
        await ctx.runMutation(internal.users.markGenerationProcessing, {
          generationId: typedGenerationId,
        });
      } else if (transition === "completed") {
        await ctx.runMutation(internal.users.completeGeneration, {
          generationId: typedGenerationId,
        });
      } else if (transition === "failed") {
        const reason = optionalString(callback?.reason);
        if (reason && reason.length > 500) {
          return jsonResponse(400, { error: "Invalid failure reason" });
        }
        await ctx.runMutation(internal.users.failGeneration, {
          generationId: typedGenerationId,
          reason,
        });
      } else {
        return jsonResponse(400, { error: "Invalid transition" });
      }
      return jsonResponse(200, { received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      console.error(`[Generation Callback] Transition failed: ${message}`);
      if (message.toLowerCase().includes("insufficient credits")) {
        return jsonResponse(402, { error: "Insufficient credits" });
      }
      return jsonResponse(409, { error: "Invalid generation transition" });
    }
  }),
});

http.route({
  path: "/api/webhooks/whop",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = env.WHOP_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      console.error("[Whop Webhook] WHOP_WEBHOOK_SECRET is not configured");
      return jsonResponse(500, { error: "Webhook not configured" });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
      return jsonResponse(413, { error: "Webhook body is too large" });
    }
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_WEBHOOK_BODY_BYTES) {
      return jsonResponse(413, { error: "Webhook body is too large" });
    }
    if (!(await verifyWebhookSignature(body, request.headers, webhookSecret))) {
      return jsonResponse(401, { error: "Invalid signature" });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body) as unknown;
    } catch {
      return jsonResponse(400, { error: "Invalid JSON" });
    }
    const event = asRecord(parsed);
    const data = event ? asRecord(event.data) : null;
    const eventType = event ? optionalString(event.type ?? event.event) : undefined;
    const eventId = request.headers.get("webhook-id")?.trim();
    if (!event || !data || !eventType || !eventId) {
      return jsonResponse(400, { error: "Missing event fields" });
    }
    if (!SUBSCRIPTION_EVENTS.has(eventType)) {
      return jsonResponse(200, { received: true, ignored: true });
    }

    const headerTimestamp = normalizeTimestamp(request.headers.get("webhook-timestamp"));
    const eventCreatedAt = normalizeTimestamp(event.created_at) ?? headerTimestamp;
    if (!eventCreatedAt) return jsonResponse(400, { error: "Missing event timestamp" });

    try {
      const outcome = await processSubscriptionEvent(
        ctx,
        eventId,
        eventCreatedAt,
        eventType as SubscriptionEvent,
        data,
      );
      return jsonResponse(200, { received: true, outcome });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      console.error(`[Whop Webhook] Failed to process ${eventType}: ${message}`);
      return jsonResponse(500, { error: message });
    }
  }),
});

http.route({
  path: "/api/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = env.CLERK_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      console.error("[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured");
      return jsonResponse(500, { error: "Webhook not configured" });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
      return jsonResponse(413, { error: "Webhook body is too large" });
    }
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_WEBHOOK_BODY_BYTES) {
      return jsonResponse(413, { error: "Webhook body is too large" });
    }
    if (!(await verifyWebhookSignature(body, request.headers, webhookSecret))) {
      return jsonResponse(401, { error: "Invalid signature" });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body) as unknown;
    } catch {
      return jsonResponse(400, { error: "Invalid JSON" });
    }
    const event = asRecord(parsed);
    const data = event ? asRecord(event.data) : null;
    const eventType = event ? optionalString(event.type) : undefined;
    const eventId = request.headers.get("webhook-id")?.trim();
    if (!event || !data || !eventType || !eventId) {
      return jsonResponse(400, { error: "Missing event fields" });
    }
    if (eventType !== "user.deleted") {
      return jsonResponse(200, { received: true, ignored: true });
    }
    const clerkId = optionalString(data.id);
    const eventCreatedAt = normalizeTimestamp(event.created_at)
      ?? normalizeTimestamp(request.headers.get("webhook-timestamp"));
    if (!clerkId || !eventCreatedAt) {
      return jsonResponse(400, { error: "Missing deletion event fields" });
    }

    try {
      const outcome: string = await ctx.runMutation(
        internal.accountDeletion.startAccountDeletionFromClerk,
        { clerkId, eventId, eventCreatedAt },
      );
      return jsonResponse(200, { received: true, outcome });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      console.error(`[Clerk Webhook] Failed to process user.deleted: ${message}`);
      return jsonResponse(500, { error: message });
    }
  }),
});

export default http;
