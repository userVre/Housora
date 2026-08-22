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
const CURRENT_LEGAL_VERSION = '2026-08-13';

function isConfiguredPlan(env, planId) {
  const configured = [
    env.WHOP_STANDARD_MONTHLY_PLAN_ID,
    env.WHOP_PLAN_STANDARD_MONTHLY,
    env.WHOP_STANDARD_YEARLY_PLAN_ID,
    env.WHOP_PLAN_STANDARD_YEARLY,
    env.WHOP_PRO_MONTHLY_PLAN_ID,
    env.WHOP_PLAN_PRO_MONTHLY,
    env.WHOP_PRO_YEARLY_PLAN_ID,
    env.WHOP_PLAN_PRO_YEARLY,
    env.WHOP_ENTERPRISE_MONTHLY_PLAN_ID,
    env.WHOP_ENTERPRISE_STARTER_MONTHLY_PLAN_ID,
    env.WHOP_ENTREPRISE_STARTER_MONTHLY_PLAN_ID,
    env.WHOP_PLAN_ENTERPRISE_STARTER,
    env.WHOP_PLAN_ENTERPRISE_MONTHLY,
    env.WHOP_ENTERPRISE_YEARLY_PLAN_ID,
    env.WHOP_ENTERPRISE_STARTER_YEARLY_PLAN_ID,
    env.WHOP_ENTREPRISE_STARTER_YEARLY_PLAN_ID,
    env.WHOP_PLAN_ENTERPRISE_YEARLY,
    env.WHOP_ENTERPRISE_PLUS_MONTHLY_PLAN_ID,
    env.WHOP_ENTREPRISE_PLUS_MONTHLY_PLAN_ID,
    env.WHOP_PLAN_ENTERPRISE_PLUS,
    env.WHOP_ENTERPRISE_PLUS_YEARLY_PLAN_ID,
    env.WHOP_ENTREPRISE_PLUS_YEARLY_PLAN_ID,
    env.WHOP_ENTERPRISE_PRO_MONTHLY_PLAN_ID,
    env.WHOP_ENTREPRISE_PRO_MONTHLY_PLAN_ID,
    env.WHOP_PLAN_ENTERPRISE_PRO,
    env.WHOP_ENTERPRISE_PRO_YEARLY_PLAN_ID,
    env.WHOP_ENTREPRISE_PRO_YEARLY_PLAN_ID,
    env.WHOP_ENTERPRISE_MAX_YEARLY_PLAN_ID,
    env.WHOP_ENTREPRISE_MAX_YEARLY_PLAN_ID,
    env.WHOP_PLAN_ENTERPRISE_MAX,
  ].filter(Boolean);
  return configured.length ? configured.includes(planId) : VALID_PLAN_IDS.has(planId);
}

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

async function readCheckoutIntent(request) {
  const type = (request.headers.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/x-www-form-urlencoded') {
    throw new HttpError(415, 'unsupported_content_type', 'Content-Type must be application/x-www-form-urlencoded.');
  }
  const bytes = await readBodyBytes(request, 4 * 1024);
  const form = new URLSearchParams(new TextDecoder().decode(bytes));
  return {
    planId: form.get('planId')?.trim() || '',
    termsAccepted: form.get('termsAccepted') === 'true',
    immediatePerformanceRequested: form.get('immediatePerformanceRequested') === 'true',
    legalVersion: form.get('legalVersion')?.trim() || '',
  };
}

export async function onRequestPost({ request, env }) {
  let posthog = null;
  let userId = null;
  try {
    assertCors(request, env);
    const auth = await requireClerkAuth(request, env);
    userId = auth.userId;
    const intent = await readCheckoutIntent(request);
    const { planId } = intent;
    if (!isConfiguredPlan(env, planId)) throw new HttpError(400, 'invalid_plan', 'The selected plan is invalid.');
    if (!intent.termsAccepted || !intent.immediatePerformanceRequested || intent.legalVersion !== CURRENT_LEGAL_VERSION) {
      throw new HttpError(400, 'checkout_acknowledgement_required', 'Please review and accept the current checkout terms before continuing.');
    }
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
    if (posthog) posthog.capture({ distinctId: auth.userId, event: 'checkout initiated', properties: { plan_id: planId, billing_mode: 'live', legal_version: CURRENT_LEGAL_VERSION } });
    return jsonResponse(request, env, { url: checkout.toString() });
  } catch (error) {
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
