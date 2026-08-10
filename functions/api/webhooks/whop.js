import { createPostHogClient } from '../../lib/posthog.js';

/**
 * Cloudflare Pages Function — Whop Webhook Handler
 * Live at: /api/webhooks/whop
 *
 * Whop uses Standard Webhooks format:
 *   Headers: webhook-id, webhook-timestamp, webhook-signature
 *   Signature: v1,<base64-hmac-sha256>
 *   Signed content: "{webhook-id}.{webhook-timestamp}.{raw-body}"
 */

const WHOP_PLAN_MAP = {
  'plan_yxeVUCgF75vlO': 'standard',
  'plan_AxQbdctmhX5Kn': 'standard',
  'plan_C7MWO8IMtbJcC': 'pro',
  'plan_hPAcqZhdB4WZ5': 'pro',
  'plan_dgZnX4Ls8lhY8': 'growth',
  'plan_8unBaQsEW9mCk': 'growth',
  'plan_lzM8trcdX71ha': 'scale',
  'plan_80drB7FPmQiKB': 'unlimited',
};

const CREDITS = { free: 5, standard: 100, pro: 190, growth: 1200, scale: 2250, unlimited: 5250 };

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifySignature(body, headers, secret) {
  if (!secret) return false;

  const webhookId = headers.get('webhook-id') || '';
  const webhookTimestamp = headers.get('webhook-timestamp') || '';
  const webhookSignature = headers.get('webhook-signature') || '';

  if (!webhookSignature) return false;

  // Reject if timestamp is older than 5 minutes (replay protection)
  const timestampAge = Math.abs(Date.now() / 1000 - parseInt(webhookTimestamp, 10));
  if (timestampAge > 300) {
    console.error('[Whop Webhook] Timestamp too old:', timestampAge, 'seconds');
    return false;
  }

  // Signed content = "{id}.{timestamp}.{body}"
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

  const secretValue = secret.replace(/^whsec_/, '');
  let secretBytes;
  try {
    const decoded = atob(secretValue);
    secretBytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  } catch (_) {
    secretBytes = new TextEncoder().encode(secret);
  }

  // Compute HMAC-SHA256
  const key = await crypto.subtle.importKey(
    'raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // Whop may send multiple signatures separated by spaces — check each
  const signatures = webhookSignature.split(' ');
  for (const sig of signatures) {
    const parts = sig.split(',');
    if (parts.length === 2 && parts[0] === 'v1') {
      if (timingSafeEqual(parts[1], computed)) return true;
    }
  }

  return false;
}

function extractClerkId(data) {
  return data.client_reference_id
    || data.user?.clerk_id
    || data.metadata?.clerk_id
    || null;
}

function mapPlanId(planId) {
  return WHOP_PLAN_MAP[planId] || 'free';
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Read raw body (must be raw text for signature verification)
  const body = await request.text();

  // 2. Verify HMAC signature
  const secret = env.WHOP_WEBHOOK_SECRET || '';
  const isValid = await verifySignature(body, request.headers, secret);
  if (!isValid) {
    console.error('[Whop Webhook] Invalid signature. Rejecting.');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Parse JSON
  let event;
  try {
    event = JSON.parse(body);
  } catch (e) {
    console.error('[Whop Webhook] Invalid JSON:', e.message);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Normalize: Whop sends either { type, data } or { event, data }
  // Whop's dashboard test can display event names with underscores while
  // delivered webhook payloads may use dots. Normalize both forms.
  const eventType = String(event.type || event.event || 'unknown').trim();
  const eventData = event.data || {};

  console.log(`[Whop Webhook] Received: ${eventType}`, JSON.stringify(eventData).slice(0, 200));

  // 4. Return 200 immediately — process async
  //    (Cloudflare Workers have up to 30s, but we respond fast)
  const response = new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  const posthog = createPostHogClient(env);
  try {
    await processEvent(eventType, eventData, env, posthog);
  } catch (e) {
    if (posthog) posthog.captureException(e, extractClerkId(eventData) || 'anonymous');
    console.error(`[Whop Webhook] Error processing ${eventType}:`, e.message);
  } finally {
    if (posthog) await posthog.shutdown();
  }

  return response;
}

async function processEvent(type, data, env, posthog) {
  const clerkId = extractClerkId(data);
  const convexUrl = env.EXPO_PUBLIC_CONVEX_URL || '';
  const convexSiteUrl = env.EXPO_PUBLIC_CONVEX_SITE_URL || '';

  if (!clerkId) {
    console.error(`[Whop Webhook] ${type}: No clerk_id found in event data`);
    return;
  }

  switch (type) {
    case 'payment.succeeded':
    case 'invoice.paid': {
      const planId = data.plan_id || data.plan?.id || data.membership?.plan?.id || data.product_id || '';
      const plan = mapPlanId(planId);
      const credits = CREDITS[plan] || CREDITS.free;

      console.log(`[Whop Webhook] Payment succeeded: clerkId=${clerkId.slice(0, 8)}... plan=${plan} credits=${credits}`);

      if (posthog) {
        posthog.capture({
          distinctId: clerkId,
          event: 'payment succeeded',
          properties: {
            plan,
            credits_awarded: credits,
            whop_plan_id: planId,
            whop_customer_id: data.customer_id || undefined,
            $set: { plan, credits_awarded: credits, whop_customer_id: data.customer_id || undefined },
          },
        });
      }

      // Update user in Convex
      if (convexUrl) {
        try {
          // Webhooks have no Clerk browser session. Ensure the user through
          // the protected server-to-server mutation instead.
          await convexMutation(convexUrl, 'users:ensureUserFromWebhook', {
            clerkId,
            email: data.user?.email || '',
            name: data.user?.name || undefined,
            webhookSecret: env.WHOP_WEBHOOK_SECRET || '',
          }, env);
          // Activate subscription
          await convexMutation(convexUrl, 'users:handleSubscriptionActivated', {
            clerkId,
            plan,
            credits,
            whopCustomerId: data.customer_id || undefined,
            whopSubscriptionId: data.subscription_id || data.id || undefined,
          }, env);
          console.log(`[Whop Webhook] Activated plan ${plan} for ${clerkId.slice(0, 8)}...`);
        } catch (e) {
          // User might not exist yet — create them first
          try {
            await convexMutation(convexUrl, 'users:ensureUserFromWebhook', {
              clerkId,
              email: data.user?.email || '',
              name: data.user?.name || undefined,
              webhookSecret: env.WHOP_WEBHOOK_SECRET || '',
            }, env);
            await convexMutation(convexUrl, 'users:handleSubscriptionActivated', {
              clerkId,
              plan,
              credits,
              whopCustomerId: data.customer_id || undefined,
              whopSubscriptionId: data.subscription_id || data.id || undefined,
            }, env);
            console.log(`[Whop Webhook] Created user + activated plan ${plan} for ${clerkId.slice(0, 8)}...`);
          } catch (e2) {
            console.error(`[Whop Webhook] Failed to create/activate user:`, e2.message);
          }
        }
      }
      break;
    }

    case 'membership.cancel_at_period_end_changed': {
      console.log(`[Whop Webhook] ${type}: cancellation schedule changed for clerkId=${clerkId.slice(0, 8)}...`);
      if (convexUrl) {
        await convexMutation(convexUrl, 'users:handleSubscriptionCancelAtPeriodEnd', {
          clerkId,
          subscriptionEnd: extractSubscriptionEnd(data),
        }, env);
      }
      break;
    }

    case 'membership.deactivated': {
      console.log(`[Whop Webhook] ${type}: Revoking access for clerkId=${clerkId.slice(0, 8)}...`);

      if (posthog) {
        posthog.capture({
          distinctId: clerkId,
          event: 'subscription canceled',
          properties: { whop_subscription_id: data.id || undefined },
        });
      }

      if (convexUrl) {
        try {
          await convexMutation(convexUrl, 'users:handleSubscriptionCanceled', { clerkId }, env);
          console.log(`[Whop Webhook] Canceled subscription for ${clerkId.slice(0, 8)}...`);
        } catch (e) {
          console.error(`[Whop Webhook] Failed to cancel subscription:`, e.message);
        }
      }
      break;
    }

    case 'membership.activated': {
      const planId = data.plan_id || data.plan?.id || data.membership?.plan?.id || data.product_id || '';
      const plan = mapPlanId(planId);
      const credits = CREDITS[plan] || CREDITS.free;

      console.log(`[Whop Webhook] ${type}: Activating plan ${plan} for clerkId=${clerkId.slice(0, 8)}...`);

      if (posthog) {
        posthog.capture({
          distinctId: clerkId,
          event: 'subscription activated',
          properties: {
            plan,
            credits_awarded: credits,
            whop_plan_id: planId,
            whop_subscription_id: data.id || undefined,
            $set: { plan, credits },
          },
        });
      }

      if (convexUrl) {
        try {
          await convexMutation(convexUrl, 'users:ensureUserFromWebhook', {
            clerkId,
            email: data.user?.email || '',
            name: data.user?.name || undefined,
            webhookSecret: env.WHOP_WEBHOOK_SECRET || '',
          }, env);
          await convexMutation(convexUrl, 'users:handleSubscriptionActivated', {
            clerkId,
            plan,
            credits,
            whopSubscriptionId: data.id || undefined,
          }, env);
        } catch (e) {
          console.error(`[Whop Webhook] Failed to activate subscription:`, e.message);
        }
      }
      break;
    }

    case 'payment.failed':
    case 'invoice.past_due': {
      console.log(`[Whop Webhook] Payment failed for clerkId=${clerkId.slice(0, 8)}...`);

      if (posthog) {
        posthog.capture({
          distinctId: clerkId,
          event: 'payment failed',
          properties: { whop_event_type: type },
        });
      }

      if (convexUrl) {
        try {
          await convexMutation(convexUrl, 'users:handleSubscriptionPaymentFailed', { clerkId }, env);
        } catch (e) {
          console.error(`[Whop Webhook] Failed to mark payment failed:`, e.message);
        }
      }
      break;
    }

    case 'refund.created': {
      console.log(`[Whop Webhook] Refund created for clerkId=${clerkId.slice(0, 8)}...`, data);
      break;
    }

    case 'dispute.created': {
      console.log(`[Whop Webhook] Dispute created for clerkId=${clerkId.slice(0, 8)}...`, data);
      break;
    }

    default:
      console.log(`[Whop Webhook] Unhandled event type: ${type}`);
  }
}

function extractSubscriptionEnd(data) {
  const value = data.end_date || data.current_period_end || data.renewal_end || data.expires_at;
  if (typeof value === 'number') return value < 100000000000 ? value * 1000 : value;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric < 100000000000 ? numeric * 1000 : numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

// Convex helper: run a query
async function convexQuery(url, functionPath, args, env) {
  const siteUrl = env.EXPO_PUBLIC_CONVEX_SITE_URL || url.replace('.convex.cloud', '.convex.site');
  const resp = await fetch(`${siteUrl}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: functionPath, args }),
  });
  if (!resp.ok) throw new Error(`Convex query ${functionPath} failed: ${resp.status}`);
  return resp.json();
}

// Convex helper: run a mutation
async function convexMutation(url, functionPath, args, env) {
  const siteUrl = env.EXPO_PUBLIC_CONVEX_SITE_URL || url.replace('.convex.cloud', '.convex.site');
  const resp = await fetch(`${siteUrl}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: functionPath, args }),
  });
  if (!resp.ok) throw new Error(`Convex mutation ${functionPath} failed: ${resp.status}`);
  return resp.json();
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, webhook-id, webhook-timestamp, webhook-signature',
    },
  });
}

// Allow Whop and deployment checks to verify that the endpoint exists.
// Actual payment events are still processed only through POST above.
export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, service: 'whop-webhook' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
