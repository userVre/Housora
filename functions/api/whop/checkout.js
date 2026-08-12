import { createPostHogClient } from '../../lib/posthog.js';
import {
  HttpError,
  assertCors,
  errorResponse,
  jsonResponse,
  optionsResponse,
  readBodyBytes,
  requireClerkAuth,
} from '../../lib/security.js';

const VALID_PLAN_IDS = new Set([
  'plan_yxeVUCgF75vlO', 'plan_AxQbdctmhX5Kn',
  'plan_C7MWO8IMtbJcC', 'plan_hPAcqZhdB4WZ5',
  'plan_dgZnX4Ls8lhY8', 'plan_8unBaQsEW9mCk',
  'plan_lzM8trcdX71ha', 'plan_80drB7FPmQiKB',
]);

function checkoutOrigin(env) {
  const allowlist = String(env.CHECKOUT_REDIRECT_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  let website;
  let origins;
  try {
    website = new URL(env.YOUR_WEBSITE_URL || '');
    origins = new Set(allowlist.map((value) => {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid origin');
      return url.origin;
    }));
  } catch {
    throw new HttpError(503, 'checkout_unavailable', 'Checkout is temporarily unavailable.');
  }
  if (website.protocol !== 'https:' || website.username || website.password || !origins.has(website.origin)) {
    throw new HttpError(503, 'checkout_unavailable', 'Checkout is temporarily unavailable.');
  }
  return website.origin;
}

async function readPlanId(request) {
  const type = (request.headers.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/x-www-form-urlencoded') {
    throw new HttpError(415, 'unsupported_content_type', 'Content-Type must be application/x-www-form-urlencoded.');
  }
  const bytes = await readBodyBytes(request, 4 * 1024);
  return new URLSearchParams(new TextDecoder().decode(bytes)).get('planId')?.trim() || '';
}

export async function onRequestPost({ request, env }) {
  let posthog = null;
  let userId = null;
  try {
    assertCors(request, env);
    const auth = await requireClerkAuth(request, env);
    userId = auth.userId;
    const planId = await readPlanId(request);
    if (!VALID_PLAN_IDS.has(planId)) throw new HttpError(400, 'invalid_plan', 'The selected plan is invalid.');
    const origin = checkoutOrigin(env);
    const success = `${origin}/pricing?checkout=success`;
    const cancel = `${origin}/pricing?checkout=canceled`;

    if (!env.WHOP_API_KEY) {
      const mockEnabled = env.ENVIRONMENT === 'development' && env.ENABLE_MOCK_CHECKOUT === 'true';
      if (!mockEnabled) throw new HttpError(503, 'checkout_unavailable', 'Checkout is temporarily unavailable.');
      return jsonResponse(request, env, { url: `${origin}/pricing?mock_checkout=${encodeURIComponent(planId)}`, mock: true });
    }

    const checkout = new URL(`https://whop.com/checkout/${planId}`);
    checkout.searchParams.set('d2c', 'true');
    checkout.searchParams.set('checkout[redirect_url]', success);
    checkout.searchParams.set('checkout[cancel_url]', cancel);
    checkout.searchParams.set('checkout[client_reference_id]', auth.userId);
    posthog = createPostHogClient(env, request);
    if (posthog) posthog.capture({ distinctId: auth.userId, event: 'checkout initiated', properties: { plan_id: planId, billing_mode: 'live' } });
    return jsonResponse(request, env, { url: checkout.toString() });
  } catch (error) {
    if (posthog && userId) posthog.captureException(error, userId);
    return errorResponse(request, env, error);
  } finally {
    if (posthog) {
      try { await posthog.shutdown(); } catch { console.error('[Analytics] Shutdown failed'); }
    }
  }
}

export function onRequestOptions({ request, env }) {
  return optionsResponse(request, env, { methods: 'POST, OPTIONS' });
}
