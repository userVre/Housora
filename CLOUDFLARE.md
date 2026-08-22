# Cloudflare deployment

The Kotlin/Ktor application remains the source of truth. Cloudflare Pages cannot execute a JVM/Ktor server, so the project generates a static Pages build from the Kotlin routes and ships the small Cloudflare Pages Functions under `functions/` for edge-only endpoints.

## Build

Run the complete cross-platform build:

```bash
bun run build
```

This compiles Ktor with the checked-in Gradle wrapper, starts a temporary
local server, exports every public route, and stops the server. The output is
written to `dist/`; the command exits non-zero if compilation or any page
export fails.

To run the website without exporting it:

```bash
bun run start
```

The output is `dist/` and the build must finish with `0 failed` pages.

## Publish to the free Pages domain

```text
bunx wrangler login
bunx wrangler pages project create housora
bun run deploy:pages
```

Cloudflare will provide a `housora.pages.dev` address. The repository includes `wrangler.toml` with `pages_build_output_dir = "./dist"`.

## Required Cloudflare settings

Configure these as Pages/Functions environment variables; never commit their values:

- `YOUR_WEBSITE_URL` — the final `https://...pages.dev` or custom-domain URL.
- `PUBLIC_SITE_URL` — the same final HTTPS URL, required during the static build.
- `ENVIRONMENT` — `production` for the production Pages environment.
- `API_ALLOWED_ORIGINS` — the exact Pages origin allowed to call protected APIs.
- `CHECKOUT_REDIRECT_ORIGINS` — the exact Pages origin; required once checkout is enabled.
- `CLERK_SECRET_KEY` — Clerk production secret.
- `WHOP_API_KEY` — Whop server key.

Image uploads use authenticated Convex Storage upload URLs; no R2 bucket or
`MEDIA_BUCKET` binding is needed. Add the Pages domain to Clerk's allowed
origins and redirect URLs, and update Convex's production site URL to the same
domain.

Cloudflare Pages serves the static pages, Clerk and Convex continue to run in
the browser, and Pages Functions handle generation and checkout endpoints. If
the full Ktor server is needed in production, deploy the JVM server separately
and keep the Pages domain in front of the public frontend.
