# PostHog post-wizard report

The wizard has completed a server-side PostHog integration for Housora AI, an AI interior design generation app. The `posthog-node` SDK (using the `posthog-node/edge` import for Cloudflare Workers compatibility) was installed and a shared client factory was added at `functions/lib/posthog.js`. All four Cloudflare Pages Function handlers were instrumented with event capture and exception tracking. Each handler creates a per-request PostHog client with `flushAt: 1` / `flushInterval: 0` and always awaits `posthog.shutdown()` in a `try/finally` block before returning — ensuring no events are silently dropped in the serverless runtime. Distinct IDs use the authenticated Clerk user ID where available (checkout, webhook) and fall back to the `X-POSTHOG-DISTINCT-ID` request header or a per-request UUID for unauthenticated endpoints. Person properties (`plan`, `credits`) are set via `$set` on subscription and payment events.

| Event name | Description | File |
|---|---|---|
| `image generated` | AI room design generation request completed successfully | `functions/api/generate.js` |
| `image generation failed` | AI room design generation request failed (upstream or server error) | `functions/api/generate.js` |
| `checkout initiated` | Authenticated user started a Whop checkout for a plan | `functions/api/whop/checkout.js` |
| `payment succeeded` | Whop webhook confirmed a successful payment or invoice | `functions/api/webhooks/whop.js` |
| `subscription activated` | User's Whop membership activated and credits assigned | `functions/api/webhooks/whop.js` |
| `subscription canceled` | User's Whop membership deactivated and account downgraded to free | `functions/api/webhooks/whop.js` |
| `payment failed` | Whop webhook reported a failed payment or past-due invoice | `functions/api/webhooks/whop.js` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics (wizard)](https://us.posthog.com/project/531821/dashboard/1916727)
- **Checkout-to-subscription funnel**: [IMxToNhE](https://us.posthog.com/project/531821/insights/IMxToNhE)
- **AI image generations over time**: [nDgOCmL5](https://us.posthog.com/project/531821/insights/nDgOCmL5)
- **Image generation success vs failure**: [BzGDWUZd](https://us.posthog.com/project/531821/insights/BzGDWUZd)
- **New subscriptions by plan**: [mf690vAz](https://us.posthog.com/project/531821/insights/mf690vAz)
- **Payment failures and cancellations**: [5suF6ePe](https://us.posthog.com/project/531821/insights/5suF6ePe)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_API_KEY` and `POSTHOG_HOST` to `.env.example` (or any bootstrap scripts) so collaborators know what to set. Also add them to the Cloudflare Pages dashboard under **Settings → Environment variables** for production deployment — the `.env` file is only read locally.
- [ ] Confirm the returning-visitor path also calls `identify` — currently identification is server-side only (via `$set` on payment/subscription events). If you add a frontend PostHog JS session, wire `posthog.identify()` on Clerk's `user.loaded` event to link anonymous session IDs to the Clerk user ID.
- [ ] This project contains **Convex** and **Clerk** data sources that PostHog can import. Run `npx @posthog/wizard warehouse` to connect them to PostHog's data warehouse for enriched reporting.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
