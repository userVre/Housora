import { PostHog } from 'posthog-node/edge';

const MAX_CONSENT_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export function hasAnalyticsConsent(request) {
  const value = request?.headers?.get('X-Housora-Analytics-Consent') || '';
  const match = /^v2;analytics=1;timestamp=(\d+)$/.exec(value);
  if (!match) return false;
  const timestamp = Number(match[1]);
  return Number.isFinite(timestamp) && timestamp <= Date.now() && Date.now() - timestamp <= MAX_CONSENT_AGE_MS;
}

export function createPostHogClient(env, request) {
  if (!hasAnalyticsConsent(request)) return null;
  const key = env.POSTHOG_API_KEY;
  const host = env.POSTHOG_HOST;

  if (!key || !host) return null;
  try {
    const parsed = new URL(host);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
  } catch {
    return null;
  }

  return new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: false,
  });
}
