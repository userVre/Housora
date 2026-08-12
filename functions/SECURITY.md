# Cloudflare Functions production security configuration

The API routes intentionally fail closed when an authentication, rate-limit,
quota, or webhook-state dependency is absent. Configure these values in the
Cloudflare production environment; do not put secrets in this repository.

## Identity and origins

- `CLERK_ISSUER`: exact HTTPS `iss` value in the Clerk JWT.
- `CLERK_JWT_AUDIENCE`: required JWT audience (the current Convex template uses
  `convex`).
- `CLERK_JWKS_URL`: optional; when set, it must have the same origin as the
  issuer. Otherwise `<issuer>/.well-known/jwks.json` is used.
- `API_ALLOWED_ORIGINS`: comma-separated exact origins. Do not use `*`.
- `CHECKOUT_REDIRECT_ORIGINS`: comma-separated HTTPS origins permitted for Whop
  redirects. `YOUR_WEBSITE_URL` must resolve to an origin in this list.

## Required bindings

- `MEDIA_BUCKET`: a private R2 bucket. Disable its `r2.dev` URL and any public
  custom domain. Assets are served only through `/api/assets/:assetId`, after a
  verified Clerk token and R2 ownership metadata check.
- `GENERATION_USER_RATE_LIMITER`: recommended 10 requests per 60 seconds.
- `GENERATION_IP_RATE_LIMITER`: recommended 30 requests per 60 seconds.
- `UPLOAD_USER_RATE_LIMITER`: recommended 30 requests per 60 seconds.
- `UPLOAD_IP_RATE_LIMITER`: recommended 60 requests per 60 seconds.
- `SECURITY_COORDINATOR`: a Durable Object namespace using the exported
  `SecurityCoordinator` class in `lib/security-coordinator.js`. Bind the same
  namespace to Pages. Configure `WHOP_WEBHOOK_SECRET` on the coordinator Worker
  as well as Pages so its alarm can re-sign durable webhook deliveries.

The coordinator atomically reserves per-user upload quotas (defaults: 100 files
and 500 MiB) and durably queues webhook deliveries. It stores completed webhook
IDs for idempotency and serializes each subscription/customer by signed event
time. Alarm retries use bounded exponential backoff.

If the bucket already has uploads from the previous flat-key layout, migrate
them to `users/<sha256-clerk-id>/<asset-id>` with `ownerId` custom metadata and
seed each user's coordinator quota before launch. Legacy objects without known
ownership should not be exposed through a public bucket URL.

## Provider configuration

- `CONVEX_URL` or `EXPO_PUBLIC_CONVEX_URL`: the HTTPS `.convex.cloud` deployment
  URL used for authenticated credit mutations.
- `EXPO_PUBLIC_CONVEX_SITE_URL` or `WEBHOOK_FORWARD_URL`: HTTPS destination for
  the signature-verified Convex Whop HTTP action.
- `IMAGE_API_URL`, `IMAGE_API_KEY`, `WHOP_API_KEY`, and
  `WHOP_WEBHOOK_SECRET`: provider configuration/secrets.
- `ENVIRONMENT=development` plus `ENABLE_MOCK_CHECKOUT=true`: both are required
  for mock checkout. Never set this combination in production.
- Optional quota overrides: `UPLOAD_QUOTA_BYTES`, `UPLOAD_QUOTA_FILES`.
- Optional generation cost: `GENERATION_CREDIT_COST` (integer from 1 through
  100; default 1).

Run the mocked regression suite without provider keys:

```sh
node --experimental-default-type=module functions/tests/security.test.mjs
```
