// Deploy this class in a small Worker and bind its Durable Object namespace to
// Pages as SECURITY_COORDINATOR. Pages Functions cannot declare Durable Object
// migrations themselves, so production wiring is intentionally explicit.
export class SecurityCoordinator {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'invalid_json' }, { status: 400 });
    }
    const path = new URL(request.url).pathname;
    try {
      if (path === '/upload/reserve') return Response.json(await this.reserveUpload(body));
      if (path === '/upload/commit') return Response.json(await this.finishUpload(body, true));
      if (path === '/upload/release') return Response.json(await this.finishUpload(body, false));
      if (path === '/webhook/claim') return Response.json(await this.claimWebhook(body));
      return Response.json({ error: 'not_found' }, { status: 404 });
    } catch {
      return Response.json({ error: 'state_error' }, { status: 500 });
    }
  }

  async reserveUpload(body) {
    const { assetId, bytes, maxBytes, maxFiles } = body;
    if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(assetId)
      || !Number.isSafeInteger(bytes) || bytes < 1
      || !Number.isSafeInteger(maxBytes) || maxBytes < 1
      || !Number.isSafeInteger(maxFiles) || maxFiles < 1) {
      return { reserved: false, reason: 'invalid' };
    }
    return this.state.storage.transaction(async (txn) => {
      const quota = (await txn.get('upload-quota')) || { bytes: 0, files: 0 };
      const existing = await txn.get(`upload:${assetId}`);
      if (existing) return { reserved: false, reason: 'duplicate' };
      if (quota.bytes + bytes > maxBytes || quota.files + 1 > maxFiles) {
        return { reserved: false, reason: 'quota' };
      }
      await txn.put(`upload:${assetId}`, { bytes, state: 'reserved', createdAt: Date.now() });
      await txn.put('upload-quota', { bytes: quota.bytes + bytes, files: quota.files + 1 });
      return { reserved: true };
    });
  }

  async finishUpload(body, committed) {
    const assetId = String(body.assetId || '');
    return this.state.storage.transaction(async (txn) => {
      const record = await txn.get(`upload:${assetId}`);
      if (!record) return { ok: false };
      if (committed) {
        await txn.put(`upload:${assetId}`, { ...record, state: 'committed' });
      } else if (record.state === 'reserved') {
        const quota = (await txn.get('upload-quota')) || { bytes: 0, files: 0 };
        await txn.delete(`upload:${assetId}`);
        await txn.put('upload-quota', {
          bytes: Math.max(0, quota.bytes - record.bytes),
          files: Math.max(0, quota.files - 1),
        });
      }
      return { ok: true };
    });
  }

  async claimWebhook(body) {
    const eventId = String(body.eventId || '');
    const entityId = String(body.entityId || '');
    const eventTime = Number(body.eventTime);
    const rawBody = String(body.rawBody || '');
    let target;
    try {
      target = new URL(body.targetUrl);
    } catch {
      return { accepted: false, reason: 'invalid' };
    }
    if (!eventId || eventId.length > 256 || !entityId || entityId.length > 256 || !Number.isSafeInteger(eventTime)
      || !rawBody || rawBody.length > 64 * 1024 || target.protocol !== 'https:' || target.username || target.password) {
      return { accepted: false, reason: 'invalid' };
    }
    const result = await this.state.storage.transaction(async (txn) => {
      const existing = await txn.get(`event:${eventId}`);
      const completed = await txn.get(`done:${eventId}`);
      if (existing || completed) return { accepted: false, reason: 'duplicate' };

      const cursor = await txn.get(`entity:${entityId}`);
      if (cursor && eventTime < cursor.eventTime) return { accepted: false, reason: 'stale' };
      await txn.put(`event:${eventId}`, {
        entityId,
        eventTime,
        rawBody,
        targetUrl: target.toString(),
        state: 'queued',
        attempts: 0,
        nextAttemptAt: Date.now(),
      });
      await txn.put(`entity:${entityId}`, { eventTime, eventId });
      return { accepted: true };
    });
    if (result.accepted) await this.state.storage.setAlarm(Date.now());
    return result;
  }

  async signedHeaders(eventId, rawBody) {
    const secret = String(this.env.WHOP_WEBHOOK_SECRET || '');
    if (!secret.startsWith('whsec_')) throw new Error('Webhook secret missing');
    const encoded = secret.slice('whsec_'.length);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Webhook secret invalid');
    const secretBytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${eventId}.${timestamp}.${rawBody}`));
    return {
      'Content-Type': 'application/json',
      'webhook-id': eventId,
      'webhook-timestamp': timestamp,
      'webhook-signature': `v1,${btoa(String.fromCharCode(...new Uint8Array(signature)))}`,
    };
  }

  async alarm() {
    const records = await this.state.storage.list({ prefix: 'event:', limit: 100 });
    const pending = Array.from(records.entries())
      .map(([key, value]) => ({ key, eventId: key.slice('event:'.length), ...value }))
      .filter((record) => record.state !== 'complete')
      .sort((left, right) => left.eventTime - right.eventTime);
    const blockedEntities = new Set();
    let nextAlarm = null;
    let processed = 0;
    for (const record of pending) {
      if (processed >= 25) {
        nextAlarm = Math.min(nextAlarm ?? Infinity, Date.now() + 1000);
        continue;
      }
      if (blockedEntities.has(record.entityId)) continue;
      if (record.nextAttemptAt > Date.now()) {
        blockedEntities.add(record.entityId);
        nextAlarm = Math.min(nextAlarm ?? Infinity, record.nextAttemptAt);
        continue;
      }
      processed += 1;
      try {
        const response = await fetch(record.targetUrl, {
          method: 'POST',
          headers: await this.signedHeaders(record.eventId, record.rawBody),
          body: record.rawBody,
        });
        if (!response.ok) throw new Error(`upstream_status_${response.status}`);
        await this.state.storage.transaction(async (txn) => {
          await txn.delete(record.key);
          await txn.put(`done:${record.eventId}`, {
            entityId: record.entityId,
            eventTime: record.eventTime,
            completedAt: Date.now(),
          });
        });
      } catch (error) {
        const attempts = record.attempts + 1;
        const delay = Math.min(60 * 60 * 1000, 1000 * (2 ** Math.min(attempts, 12)));
        const nextAttemptAt = Date.now() + delay;
        await this.state.storage.put(record.key, { ...record, state: 'retry', attempts, nextAttemptAt });
        blockedEntities.add(record.entityId);
        nextAlarm = Math.min(nextAlarm ?? Infinity, nextAttemptAt);
        console.error('[SecurityCoordinator] Webhook delivery failed', error instanceof Error ? error.message : 'UnknownError');
      }
    }
    if (nextAlarm !== null) await this.state.storage.setAlarm(nextAlarm);
  }
}

export default {
  fetch() {
    return Response.json({ error: 'not_found' }, { status: 404 });
  },
};
