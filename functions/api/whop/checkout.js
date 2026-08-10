import { createPostHogClient } from '../../lib/posthog.js';

const VALID_PLAN_IDS = new Set([
  'plan_yxeVUCgF75vlO', 'plan_AxQbdctmhX5Kn',
  'plan_C7MWO8IMtbJcC', 'plan_hPAcqZhdB4WZ5',
  'plan_dgZnX4Ls8lhY8',
  'plan_8unBaQsEW9mCk',
  'plan_lzM8trcdX71ha',
  'plan_80drB7FPmQiKB',
]);

async function verifyClerkSession(token, secretKey) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const sub = payload.sub;
    const sid = payload.sid;
    if (!sub || !sid) return null;
    if (!secretKey) return sub;
    const resp = await fetch(`https://api.clerk.com/v1/sessions/${sid}`, {
      headers: { 'Authorization': `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    });
    if (!resp.ok) return null;
    const session = await resp.json();
    if (session.status !== 'active') return null;
    return sub;
  } catch {
    return null;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const posthog = createPostHogClient(env);

  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const planId = params.get('planId')?.trim() || '';

    if (!planId) {
      return Response.json({ error: 'Missing planId' }, { status: 400, headers: corsHeaders });
    }
    if (!VALID_PLAN_IDS.has(planId)) {
      return Response.json({ error: 'Invalid plan ID' }, { status: 400, headers: corsHeaders });
    }

    const websiteUrl = env.YOUR_WEBSITE_URL || '';
    if (!websiteUrl || websiteUrl === 'YOUR_WEBSITE_URL') {
      return Response.json({ error: 'Server configuration error. Please contact support.' }, { status: 500, headers: corsHeaders });
    }

    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader ? authHeader.replace('Bearer ', '').trim() : '';
    const secretKey = env.CLERK_SECRET_KEY || '';

    let verifiedClerkId = '';
    if (sessionToken) {
      const userId = await verifyClerkSession(sessionToken, secretKey);
      if (!userId) {
        return Response.json({ error: 'Authentication required. Please sign in again.' }, { status: 401, headers: corsHeaders });
      }
      verifiedClerkId = userId;
    } else {
      const whopApiKey = env.WHOP_API_KEY || '';
      if (!whopApiKey) {
        const mockUrl = `${websiteUrl}/pricing?mock_checkout=${planId}`;
        return Response.json({ url: mockUrl, mock: true }, { headers: corsHeaders });
      }
      return Response.json({ error: 'Authentication required. Please sign in.' }, { status: 401, headers: corsHeaders });
    }

    const whopApiKey = env.WHOP_API_KEY || '';
    const redirectSuccess = `${websiteUrl}/pricing?checkout=success`;
    const redirectCancel = `${websiteUrl}/pricing?checkout=canceled`;

    if (whopApiKey) {
      const checkoutUrl = `https://whop.com/checkout/${planId}?d2c=true&checkout[redirect_url]=${encodeURIComponent(redirectSuccess)}&checkout[cancel_url]=${encodeURIComponent(redirectCancel)}&checkout[client_reference_id]=${verifiedClerkId}`;
      if (posthog) {
        posthog.capture({
          distinctId: verifiedClerkId,
          event: 'checkout initiated',
          properties: {
            plan_id: planId,
            billing_mode: 'live',
          },
        });
      }
      return Response.json({ url: checkoutUrl }, { headers: corsHeaders });
    } else {
      const mockUrl = `${websiteUrl}/pricing?mock_checkout=${planId}`;
      return Response.json({ url: mockUrl, mock: true }, { headers: corsHeaders });
    }
  } catch (e) {
    if (posthog) posthog.captureException(e, 'anonymous');
    return Response.json({ error: 'Server error: ' + e.message }, { status: 500, headers: corsHeaders });
  } finally {
    if (posthog) await posthog.shutdown();
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
