import { createPostHogClient } from '../lib/posthog.js';

function corsHeaders(request, env) {
  const allowedOrigin = env.IMAGE_API_ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

function decodeBase64Image(value) {
  const encoded = value.replace(/^data:[^;]+;base64,/, '');
  const binary = atob(encoded);
  return Array.from(binary, (character) => character.charCodeAt(0));
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request, env);
  if (!env.IMAGE_API_URL || !env.IMAGE_API_KEY) {
    return Response.json({ error: 'Add IMAGE_API_URL and IMAGE_API_KEY' }, { status: 503, headers });
  }

  const posthog = createPostHogClient(env);
  const distinctId = request.headers.get('X-POSTHOG-DISTINCT-ID') || crypto.randomUUID();

  try {
    const incoming = await request.json();
    const prompt = String(incoming?.prompt || '').trim();
    const image = String(incoming?.image || '').trim();
    if (!prompt || !image) {
      return Response.json({ error: 'Prompt and base64 image are required.' }, { status: 400, headers });
    }
    let imageBytes;
    try {
      imageBytes = decodeBase64Image(image);
    } catch {
      return Response.json({ error: 'Image must be valid base64.' }, { status: 400, headers });
    }
    const payload = { prompt, image: imageBytes };

    const response = await fetch(env.IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.IMAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (posthog) {
        posthog.capture({
          distinctId,
          event: 'image generation failed',
          properties: { reason: 'upstream_api_error', upstream_status: response.status },
        });
      }
      return Response.json({ error: 'Image generation failed. Please try again.' }, { status: 502, headers });
    }

    if (posthog) {
      posthog.capture({
        distinctId,
        event: 'image generated',
        properties: { prompt_length: prompt.length },
      });
    }
    return new Response(response.body, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': response.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (posthog) posthog.captureException(error, distinctId);
    return Response.json({ error: 'Generation failed. Please try again.' }, { status: 500, headers });
  } finally {
    if (posthog) await posthog.shutdown();
  }
}

export function onRequestOptions({ request, env }) {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}
