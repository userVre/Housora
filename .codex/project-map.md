# Housora project map

> Fast orientation map for future coding tasks. Last refreshed: 2026-08-21.
> Treat source files as authoritative when this map conflicts with the code.

## What this project is

Housora is an AI interior-design product. The repository contains two UI/runtime
surfaces that share the product domain:

- **Kotlin/Ktor source site** in `src/main/kotlin/com/housora`.
- **Next.js/React workspace** in `app/` and `components/`.
- **Convex backend** in `convex/` for auth, users, projects, uploads,
  subscriptions, and account deletion.
- **Cloudflare Pages Functions** in `functions/api/` for upload, generation,
  assets, Whop checkout, and Whop webhooks.
- **Static assets and production browser code** in `static/`.

## Main request/data flows

### Public website

`src/main/kotlin/com/housora/plugins/Routing.kt`
  -> page handlers in `src/main/kotlin/com/housora/pages/`
  -> templates in `src/main/kotlin/com/housora/templates/`
  -> generated `dist/` output
  -> Cloudflare Pages (`wrangler.toml` / `wrangler.jsonc`).

### Authenticated workspace

`app/(workspace)/layout.tsx`
  -> workspace pages (`design`, `projects`, `app/*`, `delete-account`)
  -> shared UI in `components/workspace/` and `components/tools/`
  -> Convex queries/mutations in `convex/projects.ts`, `users.ts`,
  `subscriptions.ts`, and `uploads.ts`.

### Browser authentication

Ktor layout metadata in `src/main/kotlin/com/housora/templates/Layout.kt`
  -> pinned ClerkJS runtime in `static/vendor/clerk-js/`
  -> `static/js/clerk-bootstrap.js` derives the instance Frontend API from the
     public key and loads the matching `@clerk/ui@1` browser bundle
  -> Clerk modal sign-in/sign-up and Convex JWT handoff.

### Static workspace shell and home

`src/main/kotlin/com/housora/templates/Layout.kt`
  -> persistent Library / AI tools / account sidebar for the Kotlin workspace routes
  -> header-free desktop canvas and a single floating mobile drawer button
  -> prompt-first home in `src/main/kotlin/com/housora/pages/AppHomePage.kt`
  -> recent Convex projects, credit status, Clerk profile UI, and local example likes in `static/js/main.js`.

The dedicated `/app/images` and `/app/likes` library screens render saved
project outputs and user-saved favourites. `/projects` uses a named,
empty-first creation flow before a user begins designing.

The complete light-only workspace shell, creator, galleries, empty states, and
responsive rules are grouped under `HOUSORA CREATIVE WORKSPACE` and the final
monochrome layer in `static/css/style.css`. The home prompt is passed to
`/design?prompt=...` and prefilled by `initWorkspaceHandoff()`.

The workspace sidebar renders the full shared `aiTools` catalog directly and
persists across every AI tool route. Tool routes remain guest-accessible, but
signed-in users get the workspace account menu and never see guest acquisition
copy; signed-out visitors get explicit sign-in/create-account actions. Its
library and tool sections scroll independently above the pinned account area;
there is no separate workspace switcher or appearance selector. The pinned
account trigger is populated from the authenticated Clerk profile name, with
username and email-prefix fallbacks.

The sidebar footer uses one account trigger and a progressive account menu.
Profile, plan upgrade, billing, usage, refunds, account deletion, help, and
sign-out are disclosed there instead of appearing as persistent sidebar rows.

### Image generation and billing

UI/tool pages or `app/api/generate/route.ts`
  -> Convex/http or Cloudflare API functions
  -> `functions/api/generate.js`, `upload.js`, and `assets/[assetId].js`
  -> persisted project/upload data in Convex.

Public tool pages now open directly at the shared upload/configuration surface.
An unsigned visitor may complete one guest generation, tracked by a server-set
trial cookie plus the generation IP limiter; subsequent attempts open sign-up.
New Convex users begin with three free generation credits, after which paid
plan credits are enforced by the existing authenticated generation flow.

Whop checkout/webhook paths:

`app/api/whop/checkout/route.ts` or `functions/api/whop/checkout.js`
  -> Whop
  -> `app/api/webhooks/whop/route.ts` or `functions/api/webhooks/whop.js`
  -> `convex/subscriptions.ts`.

## Important directories and entry points

| Area | Start here | Responsibility |
|---|---|---|
| Next app shell | `app/layout.tsx`, `app/globals.css` | Global layout, providers, styles |
| Workspace | `app/(workspace)/layout.tsx` | Signed-in product shell and navigation |
| Design tool | `components/tools/DesignTool.tsx` | Main design-generation interaction |
| Tool catalog | `lib/tool-data.ts`, `components/tools/ToolLandingPage.tsx` | AI tool metadata and landing pages |
| Blog | `lib/blog-data.ts`, `app/blog/` | Blog content and routes |
| Convex schema | `convex/schema.ts` | Database tables and indexes |
| Convex auth | `convex/auth.config.ts`, `convex/lib/auth.ts` | Identity/auth checks |
| Browser auth | `static/js/clerk-bootstrap.js`, `src/main/kotlin/com/housora/templates/Layout.kt` | ClerkJS/UI initialization and browser auth events |
| Projects | `convex/projects.ts`, `components/workspace/ProjectsGrid.tsx` | Project CRUD and display |
| Uploads | `convex/uploads.ts`, `functions/api/upload.js` | Upload lifecycle and asset access |
| Billing | `convex/subscriptions.ts`, Whop routes | Plans, entitlements, webhooks |
| Security tests | `convex/security.convex.test.ts`, `functions/tests/` | Backend and edge security coverage |
| Build/assets | `build-site.js`, `scripts/build-assets.js`, `scripts/verify-assets.js` | Site export and asset pipeline |

## Route families

- Marketing/content: `/`, `/pricing`, `/examples`, `/faq`, `/contact`,
  `/enterprise`, `/blog`, `/compare/[competitor]`, `/[slug]`.
- Legal/account: `/privacy`, `/terms`, `/cookies`, `/refund-policy`,
  `/sign-in`, `/sign-up`, `/sign-out`.
- Workspace: `/design`, `/projects`, `/app/home`, `/app/images`, `/app/likes`,
  `/app/plan`, `/app/usage`, `/delete-account`.
- API: `/api/generate`, `/api/upload`, `/api/assets/[assetId]`, Whop checkout
  and webhook endpoints.

## Build, test, and deploy

- `bun run dev`: Convex development workflow.
- `bun run test`: unit/security and Kotlin tests.
- `bun run build`: assets, site build, publish, and verification.
- `bun run build:static`: static site output to `dist/`.
- `bun run deploy:pages`: verify assets then deploy `dist/` to Pages.
- `./gradlew run` or `bun run start`: local Ktor server on port 8081.

Node is pinned to `22.22.0` in `.nvmrc` and `.node-version`; Bun is pinned to
`1.3.14` through the `packageManager` field and `bun.lock`.

## Working rules and caveats

- Prefer the smallest relevant slice: workspace changes usually start in
  `app/`, `components/`, and `convex/`; public SEO/content changes usually
  start in `src/` and `lib/`.
- Do not treat `build/`, `dist/`, `reports/`, screenshots, or logs as source
  unless the task explicitly targets generated/audit output.
- Environment files contain secrets/configuration; do not expose their values.
- `convex/_generated/ai/guidelines.md` is referenced by `AGENTS.md` but was not
  present when this map was generated. Re-check it before changing Convex code;
  if it appears later, it overrides this map.

## Refresh policy

Refresh this file after changes to routes, major directories, backend data flow,
build/deploy commands, or authentication/billing architecture. For a focused
task, inspect the relevant files listed above before scanning the whole repo.
