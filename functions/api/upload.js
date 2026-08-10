import { createPostHogClient } from '../lib/posthog.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const posthog = createPostHogClient(env);
  const distinctId = request.headers.get('X-POSTHOG-DISTINCT-ID') || crypto.randomUUID();

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return Response.json({ error: 'Invalid file type. Only JPG, PNG, WebP allowed.' }, { status: 400, headers: corsHeaders });
      }
      if (file.size > MAX_SIZE) {
        return Response.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400, headers: corsHeaders });
      }
      const ext = file.type.split('/')[1];
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      await env.MEDIA_BUCKET.put(fileName, arrayBuffer, { httpMetadata: { contentType: file.type } });
      if (posthog) {
        posthog.capture({
          distinctId,
          event: 'file uploaded',
          properties: { file_type: file.type, file_size: file.size, upload_method: 'multipart' },
        });
      }
      return Response.json({ storageId: fileName, fileName }, { headers: corsHeaders });
    }

    const bytes = await request.arrayBuffer();
    if (!bytes || bytes.byteLength === 0) {
      return Response.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
    }
    if (bytes.byteLength > MAX_SIZE) {
      return Response.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400, headers: corsHeaders });
    }
    const header = new Uint8Array(bytes.slice(0, 4));
    let ext = 'jpg';
    let fileType = 'image/jpeg';
    if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
      ext = 'jpg'; fileType = 'image/jpeg';
    } else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      ext = 'png'; fileType = 'image/png';
    } else if (bytes.byteLength >= 12 && header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
      ext = 'webp'; fileType = 'image/webp';
    } else {
      return Response.json({ error: 'Invalid file type. Only JPG, PNG, WebP allowed.' }, { status: 400, headers: corsHeaders });
    }
    const fileName = `${crypto.randomUUID()}.${ext}`;
    await env.MEDIA_BUCKET.put(fileName, bytes, { httpMetadata: { contentType: fileType } });
    if (posthog) {
      posthog.capture({
        distinctId,
        event: 'file uploaded',
        properties: { file_type: fileType, file_size: bytes.byteLength, upload_method: 'raw' },
      });
    }
    return Response.json({ storageId: fileName, fileName }, { headers: corsHeaders });
  } catch (e) {
    if (posthog) posthog.captureException(e, distinctId);
    return Response.json({ error: 'Upload failed: ' + e.message }, { status: 500, headers: corsHeaders });
  } finally {
    if (posthog) await posthog.shutdown();
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
