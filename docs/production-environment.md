# Production environment

Housora's local `.env` and `.env.local` files are for development only and
must never be committed. Test Clerk keys (`pk_test_…` / `sk_test_…`) are valid
only for `localhost` development.

Before a production release, configure the deployment secret store with these
values, using the real production host in every URL:

| Variable | Production requirement |
| --- | --- |
| `YOUR_WEBSITE_URL` | Canonical HTTPS origin, for example `https://housora.app`; no trailing path. This is also the allowed browser origin for generation requests. |
| `CLERK_PUBLISHABLE_KEY` | Clerk **production** publishable key (`pk_live_…`). `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are accepted aliases for the existing server configuration. |
| `CLERK_SECRET_KEY` | Matching Clerk production secret (`sk_live_…`); server-side only. |
| `CLERK_JWT_ISSUER_DOMAIN` | Exact production Clerk issuer domain. |
| `EXPO_PUBLIC_CONVEX_URL` | Production Convex deployment URL. |
| `IMAGE_API_URL`, `IMAGE_API_KEY` | Production image-generation endpoint and server-side key. |
| `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET` | Production Whop credentials; server-side only. |
| `WHOP_*_PLAN_ID` | Production IDs for every paid plan and billing interval. Existing `WHOP_PLAN_STANDARD_*`, `WHOP_PLAN_PRO_*`, and `WHOP_PLAN_ENTERPRISE_*` names are accepted aliases. |
| `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` | Optional public PostHog project key (`phc_…`) and regional HTTPS host. |

The current Ktor generation CORS policy accepts only `YOUR_WEBSITE_URL`,
`http://localhost:8081`, and `http://127.0.0.1:8081`. Set
`YOUR_WEBSITE_URL` to the exact production origin before deployment; do not
add wildcard origins. Configure the same production origin in Clerk's allowed
origins/redirect URLs and in the payment provider's return URLs.

Release gate: verify that the deployed environment contains `pk_live_…` and
`sk_live_…`, while local-only files retain test keys. No secrets belong in
source, static HTML, screenshots, or this document.
