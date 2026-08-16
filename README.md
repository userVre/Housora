# Housora

Housora is a Kotlin/Ktor website with a Convex backend and Cloudflare Pages
Functions for uploads, image generation, analytics, and checkout.

## Local development

Use Node.js 22.22.0 (pinned in `.nvmrc` and `.node-version`). With nvm:

```bash
nvm install
nvm use
node --version
```

The version printed should be `v22.22.0`.

```bash
./gradlew run
```

Open `http://localhost:8081`.

## Verification

```bash
npm test
PUBLIC_SITE_URL=http://localhost:8081 node build-site.js
```

The first command runs Convex, Cloudflare edge-security, and Kotlin tests. The
second compiles Ktor, exports every public route to `dist/`, and verifies route,
link, fragment, and asset parity.

## Repository layout

- `src/`: Ktor application, routes, templates, and pages.
- `convex/`: database schema and backend functions.
- `functions/`: Cloudflare Pages Functions.
- `static/`: production CSS, JavaScript, metadata, and referenced images.
- `scripts/`: active build, asset, accessibility, SEO, and localization tools.
- `tssawar/`: archived visuals that are not served or copied into production.

Generated directories such as `build/`, `dist/`, `reports/`, and local logs are
ignored by Git.
