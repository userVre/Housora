import { createPostHogClient } from '../lib/posthog.js';
import { inspectImage, SUPPORTED_IMAGE_TYPES } from '../lib/images.js';
import {
  HttpError,
  assertCors,
  coordinatorJson,
  enforceRateLimits,
  errorResponse,
  jsonResponse,
  optionsResponse,
  readBodyBytes,
  requireClerkAuth,
  sha256Hex,
} from '../lib/security.js';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_MULTIPART_OVERHEAD = 256 * 1024;
const IMAGE_LIMITS = { maxBytes: MAX_FILE_BYTES, maxDimension: 8192, maxPixels: 32_000_000 };

function fileSizeBucket(bytes) {
  if (bytes < 1024 * 1024) return 'under_1mb';
  if (bytes < 4 * 1024 * 1024) return '1_to_4mb';
  return '4_to_8mb';
}

function quotaConfig(env) {
  const maxBytes = Number(env.UPLOAD_QUOTA_BYTES || 500 * 1024 * 1024);
  const maxFiles = Number(env.UPLOAD_QUOTA_FILES || 100);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < MAX_FILE_BYTES || !Number.isSafeInteger(maxFiles) || maxFiles < 1) {
    throw new HttpError(503, 'upload_unavailable', 'Uploads are temporarily unavailable.');
  }
  return { maxBytes, maxFiles };
}

async function parseUpload(request) {
  const fullType = request.headers.get('Content-Type') || '';
  const contentType = fullType.split(';', 1)[0].trim().toLowerCase();
  if (contentType === 'multipart/form-data') {
    const body = await readBodyBytes(request, MAX_FILE_BYTES + MAX_MULTIPART_OVERHEAD);
    let form;
    try {
      form = await new Response(body, { headers: { 'Content-Type': fullType } }).formData();
    } catch {
      throw new HttpError(400, 'invalid_multipart', 'The multipart upload is invalid.');
    }
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') throw new HttpError(400, 'file_required', 'A file is required.');
    if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      throw new HttpError(415, 'unsupported_image', 'Only JPEG, PNG, and WebP images are supported.');
    }
    return { bytes: new Uint8Array(await file.arrayBuffer()), declaredType: file.type.toLowerCase() };
  }
  if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
    throw new HttpError(415, 'unsupported_content_type', 'Content-Type must be image/jpeg, image/png, image/webp, or multipart/form-data.');
  }
  return { bytes: await readBodyBytes(request, MAX_FILE_BYTES), declaredType: contentType };
}

export async function onRequestPost({ request, env }) {
  let posthog = null;
  let auth = null;
  try {
    assertCors(request, env);
    auth = await requireClerkAuth(request, env);
    await enforceRateLimits(request, env, auth.userId, 'upload');
    if (!env.MEDIA_BUCKET || typeof env.MEDIA_BUCKET.put !== 'function') {
      throw new HttpError(503, 'upload_unavailable', 'Uploads are temporarily unavailable.');
    }

    const upload = await parseUpload(request);
    const image = inspectImage(upload.bytes, IMAGE_LIMITS);
    if (upload.declaredType !== image.type) {
      throw new HttpError(415, 'image_type_mismatch', 'The declared image type does not match its contents.');
    }

    const ownerHash = await sha256Hex(auth.userId);
    const assetId = `${crypto.randomUUID()}.${image.ext}`;
    const key = `users/${ownerHash}/${assetId}`;
    const quota = quotaConfig(env);
    const reserved = await coordinatorJson(env.SECURITY_COORDINATOR, `upload:${ownerHash}`, '/upload/reserve', {
      assetId,
      bytes: upload.bytes.byteLength,
      ...quota,
    });
    if (!reserved.reserved) {
      if (reserved.reason === 'quota') throw new HttpError(429, 'upload_quota_exceeded', 'The upload quota has been reached.');
      throw new HttpError(503, 'upload_unavailable', 'Uploads are temporarily unavailable.');
    }
    try {
      await env.MEDIA_BUCKET.put(key, upload.bytes, {
        httpMetadata: { contentType: image.type, cacheControl: 'private, no-store' },
        customMetadata: {
          ownerId: auth.userId,
          assetId,
          uploadedAt: String(Date.now()),
          width: String(image.width),
          height: String(image.height),
        },
      });
    } catch {
      await coordinatorJson(env.SECURITY_COORDINATOR, `upload:${ownerHash}`, '/upload/release', { assetId });
      throw new HttpError(503, 'upload_failed', 'The upload could not be completed.');
    }
    await coordinatorJson(env.SECURITY_COORDINATOR, `upload:${ownerHash}`, '/upload/commit', { assetId });
    posthog = createPostHogClient(env, request);
    if (posthog) posthog.capture({ distinctId: auth.userId, event: 'file uploaded', properties: { file_type: image.type, file_size_bucket: fileSizeBucket(upload.bytes.byteLength) } });
    return jsonResponse(request, env, {
      assetId,
      storageId: assetId,
      fileName: assetId,
      url: `${new URL(request.url).origin}/api/assets/${encodeURIComponent(assetId)}`,
    }, { status: 201, methods: 'POST, OPTIONS' });
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
