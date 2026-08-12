import {
  HttpError,
  coordinatorJson,
  errorResponse,
  jsonResponse,
  readBodyBytes,
} from '../../lib/security.js';

const MAX_WEBHOOK_BYTES = 64 * 1024;

function webhookSecretBytes(secret) {
  if (!secret || !secret.startsWith('whsec_')) {
    throw new HttpError(503, 'webhook_unavailable', 'The webhook endpoint is not configured.');
  }
  try {
    const value = secret.slice('whsec_'.length);
    if (!value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('Invalid secret');
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    throw new HttpError(503, 'webhook_unavailable', 'The webhook endpoint is not configured.');
  }
}

export async function verifyWhopSignature(rawBody, headers, secret, now = Date.now()) {
  const eventId = headers.get('webhook-id') || '';
  const timestampValue = headers.get('webhook-timestamp') || '';
  const signatureHeader = headers.get('webhook-signature') || '';
  const timestamp = Number(timestampValue);
  if (!eventId || eventId.length > 256 || !Number.isSafeInteger(timestamp)
    || Math.abs(Math.floor(now / 1000) - timestamp) > 300 || !signatureHeader) return false;

  let key;
  try {
    key = await crypto.subtle.importKey('raw', webhookSecretBytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    return false;
  }
  const signed = new TextEncoder().encode(`${eventId}.${timestampValue}.${rawBody}`);
  for (const candidate of signatureHeader.split(/\s+/)) {
    const match = /^v1,([A-Za-z0-9+/]+={0,2})$/.exec(candidate);
    if (!match) continue;
    try {
      const signature = Uint8Array.from(atob(match[1]), (character) => character.charCodeAt(0));
      if (await crypto.subtle.verify('HMAC', key, signature, signed)) return true;
    } catch {
      // Keep checking any other signatures in the header.
    }
  }
  return false;
}

function eventTime(event, headers) {
  const candidate = event.created_at ?? event.timestamp ?? event.data?.created_at ?? event.data?.timestamp;
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    const millis = candidate < 100000000000 ? candidate * 1000 : candidate;
    if (Number.isSafeInteger(millis)) return millis;
  }
  if (typeof candidate === 'string') {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) {
      const millis = numeric < 100000000000 ? numeric * 1000 : numeric;
      if (Number.isSafeInteger(millis)) return millis;
    }
    const parsed = Date.parse(candidate);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  return Number(headers.get('webhook-timestamp')) * 1000;
}

function eventEntity(event) {
  const data = event.data || {};
  return String(
    data.subscription_id || data.membership?.id || data.membership_id
    || data.customer_id || data.client_reference_id || data.id || '',
  );
}

function targetUrl(env) {
  const configured = env.WEBHOOK_FORWARD_URL || env.EXPO_PUBLIC_CONVEX_SITE_URL
    || (env.EXPO_PUBLIC_CONVEX_URL || '').replace('.convex.cloud', '.convex.site');
  let url;
  try {
    url = env.WEBHOOK_FORWARD_URL
      ? new URL(configured)
      : new URL('/api/webhooks/whop', configured);
  } catch {
    throw new HttpError(503, 'webhook_unavailable', 'The webhook endpoint is not configured.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new HttpError(503, 'webhook_unavailable', 'The webhook endpoint is not configured.');
  }
  return url;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const bytes = await readBodyBytes(request, MAX_WEBHOOK_BYTES);
    let rawBody;
    try {
      rawBody = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new HttpError(400, 'invalid_body', 'The webhook body is invalid.');
    }
    const valid = await verifyWhopSignature(rawBody, request.headers, env.WHOP_WEBHOOK_SECRET || '');
    if (!valid) throw new HttpError(401, 'invalid_signature', 'The webhook signature is invalid.');

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new HttpError(400, 'invalid_json', 'The webhook body must be valid JSON.');
    }
    const type = String(event?.type || event?.event || '').trim();
    const entityId = eventEntity(event);
    if (!type || type.length > 128 || !event?.data || !entityId) {
      throw new HttpError(400, 'invalid_event', 'The webhook event is invalid.');
    }
    // Validate production forwarding before claiming an event, so configuration
    // errors never consume an otherwise retryable provider delivery.
    const forwardUrl = targetUrl(env);

    const eventId = request.headers.get('webhook-id');
    const claimed = await coordinatorJson(env.SECURITY_COORDINATOR, 'webhook:whop', '/webhook/claim', {
      eventId,
      entityId,
      eventTime: eventTime(event, request.headers),
      type,
      rawBody,
      targetUrl: forwardUrl.toString(),
    });
    if (!claimed.accepted) {
      if (claimed.reason === 'duplicate' || claimed.reason === 'stale') {
        return jsonResponse(request, {}, { received: true, ignored: claimed.reason }, { status: 200 });
      }
      throw new HttpError(503, 'webhook_unavailable', 'The webhook could not be accepted.');
    }

    return jsonResponse(request, {}, { received: true }, { status: 202 });
  } catch (error) {
    return errorResponse(request, {}, error);
  }
}

export function onRequestGet({ request }) {
  return jsonResponse(request, {}, { ok: true, service: 'whop-webhook' });
}

export function onRequestOptions({ request }) {
  return jsonResponse(request, {}, {
    error: { code: 'method_not_allowed', message: 'CORS is not enabled for this server-to-server endpoint.' },
  }, { status: 405, methods: '' });
}
