# Cloudflare Pages setup

Upload the contents of `dist/` to a Cloudflare Pages project. The `functions/` folder is copied into `dist/` by `npm run build:static`, so Pages Functions are deployed with the site.

## Required Pages configuration

In Pages > Settings > Environment variables, add these server-side secrets:

- `IMAGE_API_URL` — your image Worker URL, for example `https://image-api.gymspark07.workers.dev/`.
- `IMAGE_API_KEY` — the Worker bearer token, stored only as a server-side secret.
- `WHOP_API_KEY` — required for real checkout links.
- `YOUR_WEBSITE_URL` — your final HTTPS Cloudflare domain.
- `CLERK_SECRET_KEY` — required for server-side checkout-session verification.

Add an R2 bucket binding named `MEDIA_BUCKET`. The upload function stores room photos there and `/api/uploads/<storageId>` serves them back.

The public Clerk publishable key and Convex URL are embedded when the static bundle is built from `.env`. Before running the build, make sure these values point to the production Clerk and Convex projects.

## AI generation

The browser sends `{ prompt }` to `/api/generate`. The Pages Function proxies that request to the Worker and streams the returned image back as bytes. The browser converts it to a temporary blob URL. Never put `IMAGE_API_KEY` or `VITE_IMAGE_API_KEY` in frontend JavaScript.

## Local Kotlin server

For local generation, add `IMAGE_API_URL` and `IMAGE_API_KEY` to `.env` and restart Ktor. Without them, `/api/generate` returns a clear 503 configuration response instead of a fake success.

## Product analytics and session replay

Add the public PostHog project settings to `.env` before building the Pages bundle:

```env
VITE_POSTHOG_KEY=phc_your_project_token
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

The browser integration is consent-gated: it starts only when the visitor enables Statistics. It captures page views, signup/login starts, image upload and generation outcomes, project actions, checkout outcomes, and consented masked session replays. It identifies signed-in users by Clerk ID only. It never sends prompts, photos/base64 data, passwords, payment details, or email addresses as event properties. A `phc_` project token is public by design; never put a PostHog personal/private `phx_` key in frontend code.

## Convex

Deploy the Convex functions used by the client (`users:getCredits`, `users:deductCredits`, and `users:getSubscriptionStatus`) and set the production `EXPO_PUBLIC_CONVEX_URL` before rebuilding.
