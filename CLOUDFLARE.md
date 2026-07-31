# Cloudflare deployment

The Kotlin/Ktor application remains the source of truth. Cloudflare Pages cannot execute a JVM/Ktor server, so the project generates a static Pages build from the Kotlin routes and ships the small Cloudflare Pages Functions under `functions/` for edge-only endpoints.

## Build

1. Start the Kotlin server locally:

   `cmd /c gradlew.bat run`

2. In another terminal, generate the deployable site:

   `cmd /c npm run build:static`

The output is `dist/` and the build must finish with `0 failed` pages.

## Publish to the free Pages domain

```text
npx wrangler login
npx wrangler pages project create
npx wrangler pages deploy dist --project-name housora-ai
```

Cloudflare will provide a `housora.pages.dev` address. The repository includes `wrangler.toml` with `pages_build_output_dir = "./dist"`.

## Required Cloudflare settings

Configure these as Pages/Functions environment variables; never commit their values:

- `YOUR_WEBSITE_URL` — the final `https://...pages.dev` or custom-domain URL.
- `CLERK_SECRET_KEY` — Clerk production secret.
- `WHOP_API_KEY` — Whop server key.

Create an R2 bucket and bind it to the Pages project as `MEDIA_BUCKET` for image uploads. Add the Pages domain to Clerk's allowed origins and redirect URLs, and update Convex's production site URL to the same domain.

Cloudflare Pages serves the static pages, Clerk and Convex continue to run in the browser, and the Pages Functions handle upload/checkout endpoints. If the full Ktor server is needed in production, deploy the JVM server separately and keep the Pages domain in front of the public frontend.
