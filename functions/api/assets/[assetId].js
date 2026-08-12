import {
  HttpError,
  apiHeaders,
  assertCors,
  errorResponse,
  optionsResponse,
  requireClerkAuth,
  sha256Hex,
} from '../../lib/security.js';

export async function onRequestGet({ request, env, params }) {
  try {
    assertCors(request, env);
    const auth = await requireClerkAuth(request, env);
    if (!env.MEDIA_BUCKET || typeof env.MEDIA_BUCKET.get !== 'function') {
      throw new HttpError(503, 'asset_unavailable', 'The asset is temporarily unavailable.');
    }
    const assetId = String(params?.assetId || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(assetId)) {
      throw new HttpError(404, 'asset_not_found', 'The asset was not found.');
    }
    const ownerHash = await sha256Hex(auth.userId);
    const object = await env.MEDIA_BUCKET.get(`users/${ownerHash}/${assetId}`);
    if (!object || object.customMetadata?.ownerId !== auth.userId) {
      throw new HttpError(404, 'asset_not_found', 'The asset was not found.');
    }

    const headers = apiHeaders(request, env, { methods: 'GET, OPTIONS' });
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'private, no-store');
    if (object.httpEtag) headers.set('ETag', object.httpEtag);
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    return errorResponse(request, env, error);
  }
}

export function onRequestOptions({ request, env }) {
  return optionsResponse(request, env, { methods: 'GET, OPTIONS' });
}
