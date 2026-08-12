import { HttpError, readBodyBytes } from './security.js';

function convexSiteUrl(env) {
  const configured = env.CONVEX_SITE_URL || env.EXPO_PUBLIC_CONVEX_SITE_URL
    || String(env.CONVEX_URL || env.EXPO_PUBLIC_CONVEX_URL || '').replace(/\.convex\.cloud\/?$/, '.convex.site');
  let url;
  try {
    url = new URL(configured);
  } catch {
    throw new HttpError(503, 'generation_state_unavailable', 'Generation tracking is temporarily unavailable.');
  }
  if (url.protocol !== 'https:') {
    throw new HttpError(503, 'generation_state_unavailable', 'Generation tracking is temporarily unavailable.');
  }
  return url.origin;
}

function callbackSecretBytes(secret) {
  const encoded = secret.replace(/^whsec_/, '');
  try {
    return Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  } catch {
    return new TextEncoder().encode(secret);
  }
}

export function assertGenerationCallbackConfigured(env) {
  if (!String(env.GENERATION_CALLBACK_SECRET || '').trim()) {
    throw new HttpError(503, 'generation_state_unavailable', 'Generation tracking is temporarily unavailable.');
  }
  convexSiteUrl(env);
}

async function signedGenerationRequest(env, transition) {
  assertGenerationCallbackConfigured(env);
  const body = JSON.stringify(transition);
  const eventId = `generation_${crypto.randomUUID()}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const secret = String(env.GENERATION_CALLBACK_SECRET).trim();
  const key = await crypto.subtle.importKey(
    'raw',
    callbackSecretBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = new TextEncoder().encode(`${eventId}.${timestamp}.${body}`);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, signed));
  const response = await fetch(`${convexSiteUrl(env)}/api/internal/generations/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'webhook-id': eventId,
      'webhook-timestamp': timestamp,
      'webhook-signature': `v1,${btoa(String.fromCharCode(...signature))}`,
    },
    body,
  });
  const bytes = await readBodyBytes(response, 64 * 1024);
  let result = null;
  try {
    result = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(503, 'generation_state_unavailable', 'Generation tracking is temporarily unavailable.');
  }
  if (!response.ok) {
    if (response.status === 402) {
      throw new HttpError(402, 'insufficient_credits', 'There are not enough credits for this generation.');
    }
    throw new HttpError(503, 'generation_state_unavailable', 'Generation tracking is temporarily unavailable.');
  }
  return result;
}

export async function transitionGeneration(env, transition) {
  await signedGenerationRequest(env, transition);
}

export async function deductGenerationCredit(env, auth) {
  const result = await signedGenerationRequest(env, {
    transition: 'reserve',
    clerkId: auth.userId,
  });
  return result?.reservation;
}
