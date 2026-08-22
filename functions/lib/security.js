const jwksCache = new Map();

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-site',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function configuredOrigins(env) {
  const configured = env.API_ALLOWED_ORIGINS || env.IMAGE_API_ALLOWED_ORIGIN || '';
  const values = configured.split(',').map((value) => value.trim()).filter(Boolean);
  if (values.length === 0 && env.YOUR_WEBSITE_URL) {
    try {
      values.push(new URL(env.YOUR_WEBSITE_URL).origin);
    } catch {
      // Configuration validation is performed by the caller that needs this URL.
    }
  }
  return new Set(values);
}

export function apiHeaders(request, env, options = {}) {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set('Vary', 'Origin');
  const origin = request.headers.get('Origin');
  if (origin && configuredOrigins(env).has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', options.methods || 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', options.allowedHeaders || 'Authorization, Content-Type');
    headers.set('Access-Control-Max-Age', '600');
  }
  return headers;
}

export function assertCors(request, env) {
  const origin = request.headers.get('Origin');
  if (origin && !configuredOrigins(env).has(origin)) {
    throw new HttpError(403, 'origin_not_allowed', 'This origin is not allowed.');
  }
}

export function jsonResponse(request, env, value, init = {}) {
  const headers = apiHeaders(request, env, init);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (init.headers) {
    new Headers(init.headers).forEach((headerValue, name) => headers.set(name, headerValue));
  }
  return new Response(JSON.stringify(value), { ...init, headers });
}

export function errorResponse(request, env, error) {
  if (error instanceof HttpError) {
    return jsonResponse(request, env, {
      error: { code: error.code, message: error.message },
    }, { status: error.status });
  }
  console.error('[API] Request failed', error instanceof Error ? error.name : 'UnknownError');
  return jsonResponse(request, env, {
    error: { code: 'internal_error', message: 'The request could not be completed.' },
  }, { status: 500 });
}

export function optionsResponse(request, env, options = {}) {
  try {
    assertCors(request, env);
    return new Response(null, { status: 204, headers: apiHeaders(request, env, options) });
  } catch (error) {
    return errorResponse(request, env, error);
  }
}

export async function readBodyBytes(request, maxBytes) {
  const contentLength = request.headers.get('Content-Length');
  if (contentLength !== null) {
    const declared = Number(contentLength);
    if (!Number.isSafeInteger(declared) || declared < 0) {
      throw new HttpError(400, 'invalid_content_length', 'Content-Length is invalid.');
    }
    if (declared > maxBytes) {
      throw new HttpError(413, 'body_too_large', 'The request body is too large.');
    }
  }

  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, 'body_too_large', 'The request body is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readJson(request, maxBytes) {
  const contentType = (request.headers.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new HttpError(415, 'unsupported_content_type', 'Content-Type must be application/json.');
  }
  const bytes = await readBodyBytes(request, maxBytes);
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new HttpError(400, 'invalid_json', 'The request body must be valid JSON.');
  }
}

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid base64url');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function decodeJwtJson(value) {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(decodeBase64Url(value)));
}

function getBearerToken(request) {
  const value = request.headers.get('Authorization') || '';
  const match = /^Bearer ([^\s]+)$/.exec(value);
  if (!match || match[1].length > 16 * 1024) {
    throw new HttpError(401, 'authentication_required', 'A valid sign-in session is required.');
  }
  return match[1];
}

function validateAuthConfig(env) {
  const issuer = String(env.CLERK_ISSUER || env.CLERK_JWT_ISSUER_DOMAIN || '').replace(/\/$/, '');
  const audience = String(env.CLERK_JWT_AUDIENCE || '').trim();
  let issuerUrl;
  try {
    issuerUrl = new URL(issuer);
  } catch {
    throw new HttpError(503, 'authentication_unavailable', 'Authentication is temporarily unavailable.');
  }
  if (!audience || issuerUrl.protocol !== 'https:' || issuerUrl.username || issuerUrl.password
    || issuerUrl.origin !== issuer || issuerUrl.search || issuerUrl.hash) {
    throw new HttpError(503, 'authentication_unavailable', 'Authentication is temporarily unavailable.');
  }
  return { issuer, audience };
}

async function getJwks(env, issuer) {
  if (env.CLERK_JWKS_JSON) {
    try {
      const parsed = typeof env.CLERK_JWKS_JSON === 'string' ? JSON.parse(env.CLERK_JWKS_JSON) : env.CLERK_JWKS_JSON;
      if (!Array.isArray(parsed?.keys)) throw new Error('Missing keys');
      return parsed;
    } catch {
      throw new HttpError(503, 'authentication_unavailable', 'Authentication is temporarily unavailable.');
    }
  }

  const url = env.CLERK_JWKS_URL || `${issuer}/.well-known/jwks.json`;
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new HttpError(503, 'authentication_unavailable', 'Authentication is temporarily unavailable.');
  }
  if (parsedUrl.protocol !== 'https:' || (env.CLERK_JWKS_URL && parsedUrl.origin !== new URL(issuer).origin)) {
    throw new HttpError(503, 'authentication_unavailable', 'Authentication is temporarily unavailable.');
  }

  const cached = jwksCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  let response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new HttpError(503, 'authentication_unavailable', 'Authentication is temporarily unavailable.');
  }
  if (!response.ok) throw new HttpError(503, 'authentication_unavailable', 'Authentication is temporarily unavailable.');
  const value = await response.json();
  if (!Array.isArray(value?.keys)) throw new HttpError(503, 'authentication_unavailable', 'Authentication is temporarily unavailable.');
  jwksCache.set(url, { value, expiresAt: Date.now() + 5 * 60 * 1000 });
  return value;
}

export async function requireClerkAuth(request, env) {
  const token = getBearerToken(request);
  const { issuer, audience } = validateAuthConfig(env);
  const parts = token.split('.');
  if (parts.length !== 3) throw new HttpError(401, 'invalid_token', 'The sign-in session is invalid or expired.');

  let header;
  let claims;
  let signature;
  try {
    header = decodeJwtJson(parts[0]);
    claims = decodeJwtJson(parts[1]);
    signature = decodeBase64Url(parts[2]);
  } catch {
    throw new HttpError(401, 'invalid_token', 'The sign-in session is invalid or expired.');
  }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new HttpError(401, 'invalid_token', 'The sign-in session is invalid or expired.');
  }

  const jwks = await getJwks(env, issuer);
  const jwk = jwks.keys.find((candidate) => candidate.kid === header.kid && candidate.kty === 'RSA' && (!candidate.use || candidate.use === 'sig'));
  if (!jwk) throw new HttpError(401, 'invalid_token', 'The sign-in session is invalid or expired.');
  try {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signature,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) throw new Error('Invalid signature');
  } catch {
    throw new HttpError(401, 'invalid_token', 'The sign-in session is invalid or expired.');
  }

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== issuer || !audiences.includes(audience)
    || typeof claims.sub !== 'string' || !claims.sub
    || typeof claims.exp !== 'number' || claims.exp <= now
    || (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || claims.nbf > now + 30))
    || (claims.iat !== undefined && (typeof claims.iat !== 'number' || claims.iat > now + 30))) {
    throw new HttpError(401, 'invalid_token', 'The sign-in session is invalid or expired.');
  }
  return { userId: claims.sub, token, claims };
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function clientIp(request) {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip || ip.length > 64 || !/^[0-9a-fA-F:.]+$/.test(ip)) {
    throw new HttpError(503, 'rate_limit_unavailable', 'Request protection is temporarily unavailable.');
  }
  return ip;
}

async function applyLimit(binding, key) {
  if (!binding || typeof binding.limit !== 'function') {
    throw new HttpError(503, 'rate_limit_unavailable', 'Request protection is temporarily unavailable.');
  }
  let result;
  try {
    result = await binding.limit({ key });
  } catch {
    throw new HttpError(503, 'rate_limit_unavailable', 'Request protection is temporarily unavailable.');
  }
  if (!result?.success) throw new HttpError(429, 'rate_limited', 'Too many requests. Please try again later.');
}

export async function enforceRateLimits(request, env, userId) {
  const names = ['GENERATION_USER_RATE_LIMITER', 'GENERATION_IP_RATE_LIMITER'];
  const [userKey, ipKey] = await Promise.all([sha256Hex(userId), sha256Hex(clientIp(request))]);
  await Promise.all([
    applyLimit(env[names[0]], userKey),
    applyLimit(env[names[1]], ipKey),
  ]);
}

export async function enforceGuestRateLimit(request, env) {
  const ipKey = await sha256Hex(clientIp(request));
  await applyLimit(env.GENERATION_IP_RATE_LIMITER, `guest:${ipKey}`);
}

export function getCoordinatorStub(binding, shard) {
  if (!binding) throw new HttpError(503, 'security_state_unavailable', 'Request protection is temporarily unavailable.');
  if (typeof binding.idFromName === 'function' && typeof binding.get === 'function') {
    return binding.get(binding.idFromName(shard));
  }
  if (typeof binding.fetch === 'function') return binding;
  throw new HttpError(503, 'security_state_unavailable', 'Request protection is temporarily unavailable.');
}

export async function coordinatorJson(binding, shard, path, payload) {
  const stub = getCoordinatorStub(binding, shard);
  let response;
  try {
    response = await stub.fetch(`https://security.internal${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new HttpError(503, 'security_state_unavailable', 'Request protection is temporarily unavailable.');
  }
  if (!response.ok) throw new HttpError(503, 'security_state_unavailable', 'Request protection is temporarily unavailable.');
  try {
    return await response.json();
  } catch {
    throw new HttpError(503, 'security_state_unavailable', 'Request protection is temporarily unavailable.');
  }
}
