import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
  env: {
    CLERK_JWT_ISSUER_DOMAIN: v.string(),
    CLERK_WEBHOOK_SECRET: v.optional(v.string()),
    GENERATION_CALLBACK_SECRET: v.optional(v.string()),
    WHOP_WEBHOOK_SECRET: v.string(),
    WHOP_STANDARD_MONTHLY_PLAN_ID: v.optional(v.string()),
    WHOP_STANDARD_YEARLY_PLAN_ID: v.optional(v.string()),
    WHOP_PRO_MONTHLY_PLAN_ID: v.optional(v.string()),
    WHOP_PRO_YEARLY_PLAN_ID: v.optional(v.string()),
    WHOP_ENTREPRISE_STARTER_MONTHLY_PLAN_ID: v.optional(v.string()),
    WHOP_ENTREPRISE_STARTER_YEARLY_PLAN_ID: v.optional(v.string()),
    WHOP_ENTREPRISE_PLUS_MONTHLY_PLAN_ID: v.optional(v.string()),
    WHOP_ENTREPRISE_PLUS_YEARLY_PLAN_ID: v.optional(v.string()),
    WHOP_ENTREPRISE_PRO_MONTHLY_PLAN_ID: v.optional(v.string()),
    WHOP_ENTREPRISE_PRO_YEARLY_PLAN_ID: v.optional(v.string()),
    WHOP_ENTREPRISE_MAX_YEARLY_PLAN_ID: v.optional(v.string()),
  },
});
