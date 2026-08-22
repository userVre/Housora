import { createPostHogClient } from '../lib/posthog.js';
import {
  assertGenerationCallbackConfigured,
  deductGenerationCredit,
  transitionGeneration,
} from '../lib/convex.js';
import { decodeBase64Image, inspectImage } from '../lib/images.js';
import {
  HttpError,
  apiHeaders,
  assertCors,
  enforceGuestRateLimit,
  enforceRateLimits,
  errorResponse,
  optionsResponse,
  readBodyBytes,
  readJson,
  requireClerkAuth,
} from '../lib/security.js';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_JSON_BYTES = 11 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 12 * 1024 * 1024;
const IMAGE_LIMITS = { maxBytes: MAX_IMAGE_BYTES, maxDimension: 4096, maxPixels: 16_000_000 };

async function refundGeneration(env, generationId) {
  if (!generationId) return;
  try {
    await transitionGeneration(env, {
      generationId,
      transition: 'failed',
      reason: 'provider_failure',
    });
  } catch {
    console.error('[Generation] Automatic credit refund failed');
  }
}

export async function onRequestPost({ request, env }) {
  let posthog = null;
  let auth = null;
  let guestRequest = false;
  let generationId = null;
  try {
    assertCors(request, env);
    const authorization = request.headers.get('Authorization') || '';
    guestRequest = !authorization.trim();
    if (guestRequest) {
      const cookies = request.headers.get('Cookie') || '';
      if (/(?:^|;\s*)housora_guest_generation_used=1(?:;|$)/.test(cookies)) {
        throw new HttpError(403, 'guest_trial_used', 'Your free guest design is used. Create an account to get 3 more generations.');
      }
      await enforceGuestRateLimit(request, env);
      auth = { userId: 'guest', token: null, claims: null };
    } else {
      auth = await requireClerkAuth(request, env);
      await enforceRateLimits(request, env, auth.userId);
    }
    if (!env.IMAGE_API_URL || !env.IMAGE_API_KEY) {
      throw new HttpError(503, 'generation_unavailable', 'Image generation is temporarily unavailable.');
    }
    let providerUrl;
    try {
      providerUrl = new URL(env.IMAGE_API_URL);
    } catch {
      throw new HttpError(503, 'generation_unavailable', 'Image generation is temporarily unavailable.');
    }
    if (providerUrl.protocol !== 'https:') {
      throw new HttpError(503, 'generation_unavailable', 'Image generation is temporarily unavailable.');
    }
    const incoming = await readJson(request, MAX_JSON_BYTES);
    const prompt = typeof incoming?.prompt === 'string' ? incoming.prompt.trim() : '';
    if (!prompt || prompt.length > 2_000) {
      throw new HttpError(400, 'invalid_prompt', 'Prompt must contain between 1 and 2,000 characters.');
    }
    const decoded = decodeBase64Image(incoming?.image, MAX_IMAGE_BYTES);
    const imageInfo = inspectImage(decoded.bytes, IMAGE_LIMITS);
    if (decoded.declaredType && decoded.declaredType !== imageInfo.type) {
      throw new HttpError(415, 'image_type_mismatch', 'The declared image type does not match its contents.');
    }
    if (!guestRequest) {
      assertGenerationCallbackConfigured(env);
      const credit = await deductGenerationCredit(env, auth);
      generationId = credit?.generationId || null;
      try {
        await transitionGeneration(env, { generationId, transition: 'processing' });
      } catch (error) {
        await refundGeneration(env, generationId);
        throw error;
      }
    }
    posthog = createPostHogClient(env, request);

    let upstream;
    try {
      upstream = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.IMAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, image: Array.from(decoded.bytes) }),
      });
    } catch {
      await refundGeneration(env, generationId);
      throw new HttpError(502, 'generation_failed', 'Image generation failed. Please try again.');
    }
    if (!upstream.ok) {
      await refundGeneration(env, generationId);
      if (posthog && !guestRequest) posthog.capture({ distinctId: auth.userId, event: 'image generation failed', properties: { reason: 'provider_error', provider_status: upstream.status } });
      throw new HttpError(502, 'generation_failed', 'Image generation failed. Please try again.');
    }

    let output;
    let outputInfo;
    try {
      output = await readBodyBytes(upstream, MAX_OUTPUT_BYTES);
      outputInfo = inspectImage(output, { maxBytes: MAX_OUTPUT_BYTES, maxDimension: 8192, maxPixels: 32_000_000 });
    } catch {
      await refundGeneration(env, generationId);
      throw new HttpError(502, 'invalid_provider_response', 'Image generation failed. Please try again.');
    }
    if (posthog && !guestRequest) posthog.capture({
      distinctId: auth.userId,
      event: 'image generated',
      properties: { prompt_length_bucket: prompt.length < 100 ? 'under_100' : prompt.length < 500 ? '100_to_499' : '500_plus' },
    });

    if (!guestRequest) {
      try {
        await transitionGeneration(env, { generationId, transition: 'completed' });
      } catch (error) {
        await refundGeneration(env, generationId);
        throw error;
      }
    }
    const headers = apiHeaders(request, env, { methods: 'POST, OPTIONS' });
    headers.set('Content-Type', outputInfo.type);
    if (guestRequest) headers.append('Set-Cookie', 'housora_guest_generation_used=1; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax');
    return new Response(output, { status: 200, headers });
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
