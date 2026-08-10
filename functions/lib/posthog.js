import { PostHog } from 'posthog-node/edge';

export function createPostHogClient(env) {
  const key = env.POSTHOG_API_KEY;
  const host = env.POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!key) {
    console.error(
      'POSTHOG_API_KEY variable required by PostHog is missing or un-configured, ' +
      'this causes events to be silently missed. ' +
      'This error stops appearing once POSTHOG_API_KEY is configured'
    );
    return null;
  }

  return new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
}
