import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, test } from 'node:test';
import { onRequestPost as generate } from '../api/generate.js';
import { onRequestPost as webhook } from '../api/webhooks/whop.js';
import { onRequestPost as checkout } from '../api/whop/checkout.js';

let privateKey;
let publicJwk;
const issuer = 'https://clerk.test';
const audience = 'convex';

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function tokenFor(userId, overrides = {}) {
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-key' })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({
    iss: issuer,
    aud: audience,
    sub: userId,
    iat: now,
    exp: now + 600,
    ...overrides,
  })));
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

function png(width = 32, height = 32) {
  const bytes = new Uint8Array(45);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  new DataView(bytes.buffer).setUint32(8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  bytes.set([0x49, 0x45, 0x4e, 0x44], 37);
  return bytes;
}

function authEnv(extra = {}) {
  return {
    CLERK_ISSUER: issuer,
    CLERK_JWT_AUDIENCE: audience,
    CLERK_JWKS_JSON: JSON.stringify({ keys: [publicJwk] }),
    API_ALLOWED_ORIGINS: 'https://housora.test',
    ...extra,
  };
}

function allowLimit(success = true) {
  return { limit: async () => ({ success }) };
}

function rateEnv(extra = {}) {
  return authEnv({
    GENERATION_USER_RATE_LIMITER: allowLimit(),
    GENERATION_IP_RATE_LIMITER: allowLimit(),
    ...extra,
  });
}

function request(url, token, init = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('CF-Connecting-IP', headers.get('CF-Connecting-IP') || '203.0.113.8');
  return new Request(url, { ...init, headers });
}

function jsonBody(image = png()) {
  return JSON.stringify({
    prompt: 'A quiet modern living room',
    image: `data:image/png;base64,${btoa(String.fromCharCode(...image))}`,
  });
}

class CoordinatorMock {
  constructor() {
    this.events = new Map();
    this.eventCursor = new Map();
  }

  async fetch(input, init) {
    const path = new URL(input).pathname;
    const body = JSON.parse(init.body);
    if (path === '/webhook/claim') {
      if (this.events.has(body.eventId)) return Response.json({ accepted: false, reason: 'duplicate' });
      const cursor = this.eventCursor.get(body.entityId);
      if (cursor !== undefined && body.eventTime < cursor) return Response.json({ accepted: false, reason: 'stale' });
      this.events.set(body.eventId, 'processing');
      this.eventCursor.set(body.entityId, body.eventTime);
      if (body.targetUrl) await fetch(body.targetUrl, { method: 'POST', body: body.rawBody });
      this.events.set(body.eventId, 'complete');
      return Response.json({ accepted: true });
    }
    return Response.json({}, { status: 404 });
  }
}

async function signedWebhook(secret, eventId, body, timestamp = Math.floor(Date.now() / 1000)) {
  const keyBytes = Uint8Array.from(atob(secret.slice('whsec_'.length)), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${eventId}.${timestamp}.${body}`));
  return new Headers({
    'Content-Type': 'application/json',
    'webhook-id': eventId,
    'webhook-timestamp': String(timestamp),
    'webhook-signature': `v1,${btoa(String.fromCharCode(...new Uint8Array(signature)))}`,
  });
}

async function verifySignedCall(secret, call) {
  const eventId = call.init.headers['webhook-id'];
  const timestamp = call.init.headers['webhook-timestamp'];
  const header = call.init.headers['webhook-signature'];
  assert.match(eventId, /^generation_/);
  assert.match(timestamp, /^\d+$/);
  assert.match(header, /^v1,/);
  const keyBytes = Uint8Array.from(atob(secret.slice('whsec_'.length)), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const signature = Uint8Array.from(atob(header.slice('v1,'.length)), (character) => character.charCodeAt(0));
  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(`${eventId}.${timestamp}.${call.init.body}`),
  );
}

before(async () => {
  const pair = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }, true, ['sign', 'verify']);
  privateKey = pair.privateKey;
  publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  publicJwk.kid = 'test-key';
  publicJwk.use = 'sig';
  publicJwk.alg = 'RS256';
});

test('guest generation fails closed without request protection and repeat guests are rejected', async () => {
  const missing = await generate({ request: request('https://api.test/api/generate', null, { method: 'POST' }), env: {} });
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).error.code, 'rate_limit_unavailable');

  const repeat = await generate({
    request: request('https://api.test/api/generate', null, {
      method: 'POST',
      headers: { Cookie: 'housora_guest_generation_used=1' },
    }),
    env: {},
  });
  assert.equal(repeat.status, 403);
  assert.equal((await repeat.json()).error.code, 'guest_trial_used');

  const token = await tokenFor('user-1');
  const unconfigured = await generate({ request: request('https://api.test/api/generate', token, { method: 'POST' }), env: {} });
  assert.equal(unconfigured.status, 503);
  assert.equal((await unconfigured.json()).error.code, 'authentication_unavailable');
});

test('a forged JWT is rejected', async () => {
  const valid = await tokenFor('user-1');
  const parts = valid.split('.');
  const padded = parts[2].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - parts[2].length % 4) % 4);
  const forgedBytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  forgedBytes[0] ^= 0x01;
  const forged = `${parts[0]}.${parts[1]}.${base64Url(forgedBytes)}`;
  const response = await generate({
    request: request('https://api.test/api/generate', forged, { method: 'POST' }),
    env: authEnv(),
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'invalid_token');
});

test('generation rejects an oversized body before decoding base64', async () => {
  const token = await tokenFor('user-1');
  const response = await generate({
    request: request('https://api.test/api/generate', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': String(12 * 1024 * 1024) },
      body: '{}',
    }),
    env: rateEnv({ IMAGE_API_URL: 'https://images.test/generate', IMAGE_API_KEY: 'private' }),
  });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'body_too_large');
});

test('generation rate limits are enforced', async () => {
  const token = await tokenFor('user-1');
  const response = await generate({
    request: request('https://api.test/api/generate', token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: jsonBody(),
    }),
    env: rateEnv({
      GENERATION_USER_RATE_LIMITER: allowLimit(false),
      IMAGE_API_URL: 'https://images.test/generate',
      IMAGE_API_KEY: 'private',
    }),
  });
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, 'rate_limited');
});

test('one guest generation reaches only the image provider and marks the trial used', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(input);
    calls.push({ url: url.toString(), init });
    if (url.hostname === 'images.test') return new Response(png(), { headers: { 'Content-Type': 'image/png' } });
    throw new Error('Unexpected fetch');
  };
  try {
    const response = await generate({
      request: request('https://api.test/api/generate', null, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: jsonBody(),
      }),
      env: rateEnv({ IMAGE_API_URL: 'https://images.test/generate', IMAGE_API_KEY: 'private' }),
    });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(new URL(calls[0].url).hostname, 'images.test');
    assert.match(response.headers.get('Set-Cookie') || '', /housora_guest_generation_used=1/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('generation deducts once and uses signed internal state transitions', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(input);
    calls.push({ url: url.toString(), init });
    if (url.hostname === 'convex-site.test') {
      const body = JSON.parse(init.body);
      if (body.transition === 'reserve') {
        return Response.json({ received: true, reservation: { generationId: 'gen-1', remainingCredits: 4 } });
      }
      return Response.json({ received: true });
    }
    if (url.hostname === 'images.test') return new Response(png(), { headers: { 'Content-Type': 'image/png' } });
    throw new Error('Unexpected fetch');
  };
  try {
    const token = await tokenFor('user-1');
    const callbackSecret = `whsec_${btoa('generation-callback-secret-value')}`;
    const response = await generate({
      request: request('https://api.test/api/generate', token, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: jsonBody(),
      }),
      env: rateEnv({
        IMAGE_API_URL: 'https://images.test/generate',
        IMAGE_API_KEY: 'private',
        EXPO_PUBLIC_CONVEX_SITE_URL: 'https://convex-site.test',
        GENERATION_CALLBACK_SECRET: callbackSecret,
      }),
    });
    assert.equal(response.status, 200);
    assert.equal(new URL(calls[0].url).hostname, 'convex-site.test');
    assert.deepEqual(JSON.parse(calls[0].init.body), { transition: 'reserve', clerkId: 'user-1' });
    assert.equal(await verifySignedCall(callbackSecret, calls[0]), true);
    assert.equal(new URL(calls[1].url).hostname, 'convex-site.test');
    assert.deepEqual(JSON.parse(calls[1].init.body), { generationId: 'gen-1', transition: 'processing' });
    assert.equal(await verifySignedCall(callbackSecret, calls[1]), true);
    assert.equal(new URL(calls[2].url).hostname, 'images.test');
    assert.equal(new URL(calls[3].url).hostname, 'convex-site.test');
    assert.deepEqual(JSON.parse(calls[3].init.body), { generationId: 'gen-1', transition: 'completed' });
    assert.equal(await verifySignedCall(callbackSecret, calls[3]), true);
    assert.equal(calls.filter((call) => {
      try { return JSON.parse(call.init.body).transition === 'reserve'; } catch { return false; }
    }).length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('the browser cannot deduct, complete, or refund generations', () => {
  const browser = readFileSync(new URL('../../static/js/main.js', import.meta.url), 'utf8');
  assert.equal(browser.includes("mutation('users:deductCredits'"), false);
  assert.equal(browser.includes("mutation('users:completeGeneration'"), false);
  assert.equal(browser.includes("mutation('users:failGeneration'"), false);
});

test('checkout redirects require an HTTPS allowlist and mock mode requires explicit development flags', async () => {
  const token = await tokenFor('user-1');
  const body = 'planId=plan_yxeVUCgF75vlO&termsAccepted=true&immediatePerformanceRequested=true&legalVersion=2026-08-13';
  const insecure = await checkout({
    request: request('https://api.test/api/whop/checkout', token, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    }),
    env: authEnv({
      YOUR_WEBSITE_URL: 'http://housora.test',
      CHECKOUT_REDIRECT_ORIGINS: 'http://housora.test',
      ENVIRONMENT: 'development',
      ENABLE_MOCK_CHECKOUT: 'true',
    }),
  });
  assert.equal(insecure.status, 503);

  const productionMock = await checkout({
    request: request('https://api.test/api/whop/checkout', token, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    }),
    env: authEnv({
      YOUR_WEBSITE_URL: 'https://housora.test',
      CHECKOUT_REDIRECT_ORIGINS: 'https://housora.test',
      ENVIRONMENT: 'production',
      ENABLE_MOCK_CHECKOUT: 'true',
    }),
  });
  assert.equal(productionMock.status, 503);

  const developmentMock = await checkout({
    request: request('https://api.test/api/whop/checkout', token, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    }),
    env: authEnv({
      YOUR_WEBSITE_URL: 'https://housora.test',
      CHECKOUT_REDIRECT_ORIGINS: 'https://housora.test',
      ENVIRONMENT: 'development',
      ENABLE_MOCK_CHECKOUT: 'true',
    }),
  });
  assert.equal(developmentMock.status, 200);
  assert.equal((await developmentMock.json()).mock, true);
});

test('checkout requires both legal acknowledgements and the current policy version', async () => {
  const token = await tokenFor('user-1');
  const response = await checkout({
    request: request('https://api.test/api/whop/checkout', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'planId=plan_yxeVUCgF75vlO&termsAccepted=true&legalVersion=2026-08-13',
    }),
    env: authEnv({
      YOUR_WEBSITE_URL: 'https://housora.test',
      CHECKOUT_REDIRECT_ORIGINS: 'https://housora.test',
      ENVIRONMENT: 'development',
      ENABLE_MOCK_CHECKOUT: 'true',
    }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'checkout_acknowledgement_required');
});

test('invalid webhook signatures are rejected', async () => {
  const secret = `whsec_${btoa('test-secret-32-bytes-long-value!!')}`;
  const body = JSON.stringify({ type: 'membership.activated', data: { id: 'sub-1' } });
  const response = await webhook({
    request: new Request('https://api.test/api/webhooks/whop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'webhook-id': 'evt-invalid',
        'webhook-timestamp': String(Math.floor(Date.now() / 1000)),
        'webhook-signature': 'v1,aW52YWxpZA==',
      },
      body,
    }),
    env: { WHOP_WEBHOOK_SECRET: secret },
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, 'invalid_signature');
});

test('duplicate signed webhooks are persisted and forwarded only once', async () => {
  const originalFetch = globalThis.fetch;
  let forwarded = 0;
  globalThis.fetch = async (input) => {
    if (new URL(input).hostname === 'convex.test') {
      forwarded += 1;
      return Response.json({ received: true });
    }
    throw new Error('Unexpected fetch');
  };
  try {
    const secret = `whsec_${btoa('test-secret-32-bytes-long-value!!')}`;
    const body = JSON.stringify({
      id: 'payload-1', type: 'membership.activated', created_at: Date.now(), data: { id: 'sub-1' },
    });
    const headers = await signedWebhook(secret, 'evt-1', body);
    const coordinator = new CoordinatorMock();
    const env = {
      WHOP_WEBHOOK_SECRET: secret,
      WEBHOOK_FORWARD_URL: 'https://convex.test/api/webhooks/whop',
      SECURITY_COORDINATOR: coordinator,
    };
    const pending = [];
    const first = await webhook({
      request: new Request('https://api.test/api/webhooks/whop', { method: 'POST', headers, body }),
      env,
      waitUntil(promise) { pending.push(promise); },
    });
    assert.equal(first.status, 202);
    await Promise.all(pending);

    const second = await webhook({
      request: new Request('https://api.test/api/webhooks/whop', { method: 'POST', headers, body }),
      env,
      waitUntil() {},
    });
    assert.equal(second.status, 200);
    assert.equal((await second.json()).ignored, 'duplicate');
    assert.equal(forwarded, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('out-of-order subscription events are ignored after a newer event is accepted', async () => {
  const originalFetch = globalThis.fetch;
  let forwarded = 0;
  globalThis.fetch = async () => {
    forwarded += 1;
    return Response.json({ received: true });
  };
  try {
    const secret = `whsec_${btoa('test-secret-32-bytes-long-value!!')}`;
    const coordinator = new CoordinatorMock();
    const env = {
      WHOP_WEBHOOK_SECRET: secret,
      WEBHOOK_FORWARD_URL: 'https://convex.test/api/webhooks/whop',
      SECURITY_COORDINATOR: coordinator,
    };
    const newerBody = JSON.stringify({ type: 'membership.deactivated', created_at: 2_000, data: { id: 'sub-order' } });
    const newerHeaders = await signedWebhook(secret, 'evt-new', newerBody);
    const pending = [];
    const newer = await webhook({
      request: new Request('https://api.test/api/webhooks/whop', { method: 'POST', headers: newerHeaders, body: newerBody }),
      env,
      waitUntil(promise) { pending.push(promise); },
    });
    assert.equal(newer.status, 202);
    await Promise.all(pending);

    const olderBody = JSON.stringify({ type: 'membership.activated', created_at: 1_000, data: { id: 'sub-order' } });
    const olderHeaders = await signedWebhook(secret, 'evt-old', olderBody);
    const older = await webhook({
      request: new Request('https://api.test/api/webhooks/whop', { method: 'POST', headers: olderHeaders, body: olderBody }),
      env,
      waitUntil() {},
    });
    assert.equal(older.status, 200);
    assert.equal((await older.json()).ignored, 'stale');
    assert.equal(forwarded, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
