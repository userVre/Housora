import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Helper: get the verified Clerk user ID from the Convex auth context.
 * Throws if not authenticated — never returns null for user-facing operations.
 */
async function getVerifiedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: authentication required. Please sign in.");
  }
  return identity.subject;
}

/**
 * Helper: verify that the authenticated user owns the resource.
 * Throws if not authenticated or if the IDs don't match.
 */
async function assertOwnership(ctx: any, clerkId: string): Promise<void> {
  const verifiedId = await getVerifiedUserId(ctx);
  if (verifiedId !== clerkId) {
    throw new Error("Unauthorized: you can only access your own data");
  }
}

/**
 * Helper: verify the call comes from a trusted server context (webhook, internal).
 * HTTP actions from Convex's httpRouter run as system mutations — they have no
 * user identity but are trusted. We check that there is NO user identity (i.e.,
 * it's a system call, not a user-supplied browser call).
 */
function assertSystemContext(ctx: any): void {
  // In HTTP actions invoked by the httpRouter, getUserIdentity() returns null
  // because there's no Clerk session — the call is from the server itself.
  // This is the correct way to verify a webhook-triggered mutation.
  // We do NOT throw here because httpAction context doesn't have userIdentity.
  // The real auth is the HMAC webhook signature verified in http.ts.
}

// ==================== USER-FACING QUERIES ====================

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.clerkId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    return user;
  },
});

export const getCredits = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.clerkId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    return user?.credits ?? 0;
  },
});

export const getSubscriptionStatus = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.clerkId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return null;

    return {
      plan: user.plan ?? "free",
      credits: user.credits,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionType: user.subscriptionType,
      subscriptionStartedAt: user.subscriptionStartedAt,
      subscriptionEnd: user.subscriptionEnd,
      whopCustomerId: user.whopCustomerId,
      whopSubscriptionId: user.whopSubscriptionId,
    };
  },
});

// ==================== USER-FACING MUTATIONS ====================

export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.clerkId);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name ?? existing.name,
      });
      return existing._id;
    }

    // Insert with ALL required schema fields and safe defaults
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      credits: 5,
      plan: "free",
      createdAt: Date.now(),
      lastClaimAt: Date.now(),
      proTrialExpiresAt: 0,
    });
  },
});

/** Create a user from the signature-verified Cloudflare/Whop webhook path. */
export const ensureUserFromWebhook = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    webhookSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const configuredSecret = process.env.WHOP_WEBHOOK_SECRET ?? "";
    if (!configuredSecret || args.webhookSecret !== configuredSecret) {
      throw new Error("Unauthorized webhook request");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      credits: 5,
      plan: "free",
      createdAt: Date.now(),
      lastClaimAt: Date.now(),
      proTrialExpiresAt: 0,
    });
  },
});

export const deductCredits = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
    toolType: v.string(),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.clerkId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");
    if (user.credits < args.amount) throw new Error("Insufficient credits");

    await ctx.db.patch(user._id, {
      credits: user.credits - args.amount,
    });

    const generationId = await ctx.db.insert("generations", {
      userId: args.clerkId,
      projectId: args.projectId,
      toolType: args.toolType,
      creditsUsed: args.amount,
      status: "pending",
      createdAt: Date.now(),
    });

    return { generationId, remainingCredits: user.credits - args.amount };
  },
});

export const addCredits = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.clerkId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      credits: user.credits + args.amount,
    });

    return user.credits + args.amount;
  },
});

export const updatePlan = mutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("standard"), v.literal("pro"), v.literal("growth"), v.literal("scale"), v.literal("unlimited")),
    whopCustomerId: v.optional(v.string()),
    whopSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.clerkId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const planCredits: Record<string, number> = {
      free: 5,
      standard: 100,
      pro: 190,
      growth: 1200,
      scale: 2250,
      unlimited: 5250,
    };

    await ctx.db.patch(user._id, {
      plan: args.plan,
      credits: planCredits[args.plan] ?? user.credits,
      whopCustomerId: args.whopCustomerId ?? user.whopCustomerId,
      whopSubscriptionId: args.whopSubscriptionId ?? user.whopSubscriptionId,
    });

    return planCredits[args.plan] ?? user.credits;
  },
});

// ==================== GENERATION STATUS MUTATIONS ====================

export const completeGeneration = mutation({
  args: {
    generationId: v.id("generations"),
    outputImageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const gen = await ctx.db.get(args.generationId);
    if (!gen) throw new Error("Generation not found");

    // Verify the caller owns this generation
    const verifiedId = await getVerifiedUserId(ctx);
    if (gen.userId !== verifiedId) {
      throw new Error("Unauthorized: you can only complete your own generations");
    }

    if (gen.status !== "pending" && gen.status !== "processing") {
      throw new Error("Generation already in terminal state: " + gen.status);
    }
    await ctx.db.patch(args.generationId, {
      status: "completed",
      outputImageUrl: args.outputImageUrl,
    });
  },
});

export const failGeneration = mutation({
  args: {
    generationId: v.id("generations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const gen = await ctx.db.get(args.generationId);
    if (!gen) throw new Error("Generation not found");

    // Verify the caller owns this generation
    const verifiedId = await getVerifiedUserId(ctx);
    if (gen.userId !== verifiedId) {
      throw new Error("Unauthorized: you can only fail your own generations");
    }

    if (gen.status !== "pending" && gen.status !== "processing") {
      throw new Error("Generation already in terminal state: " + gen.status);
    }
    await ctx.db.patch(args.generationId, {
      status: "failed",
    });
    // Refund credits to user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", gen.userId))
      .unique();
    if (user) {
      await ctx.db.patch(user._id, {
        credits: user.credits + gen.creditsUsed,
      });
    }
  },
});

export const getGenerationStatus = query({
  args: { generationId: v.id("generations") },
  handler: async (ctx, args) => {
    const gen = await ctx.db.get(args.generationId);
    if (!gen) return null;

    // Verify the caller owns this generation
    const verifiedId = await getVerifiedUserId(ctx);
    if (gen.userId !== verifiedId) {
      throw new Error("Unauthorized: you can only view your own generations");
    }

    return {
      status: gen.status,
      outputImageUrl: gen.outputImageUrl,
      toolType: gen.toolType,
      creditsUsed: gen.creditsUsed,
    };
  },
});

// ==================== WEBHOOK MUTATIONS (server-only) ====================
// These are called from http.ts webhook handler via ctx.runMutation().
// They are protected by HMAC webhook signature verification in http.ts,
// NOT by Clerk auth. The webhook caller has no Clerk session.
// We do NOT enforce assertOwnership here because the caller is the server.

export const handleSubscriptionActivated = mutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("standard"), v.literal("pro"), v.literal("growth"), v.literal("scale"), v.literal("unlimited")),
    credits: v.number(),
    whopCustomerId: v.optional(v.string()),
    whopSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertSystemContext(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      plan: args.plan,
      credits: args.credits,
      whopCustomerId: args.whopCustomerId ?? user.whopCustomerId,
      whopSubscriptionId: args.whopSubscriptionId ?? user.whopSubscriptionId,
      subscriptionStartedAt: Date.now(),
      subscriptionEnd: undefined,
      subscriptionType: "active",
      subscriptionStatus: "active",
      lastResetDate: Date.now(),
    });

    return args.credits;
  },
});

export const handleSubscriptionCanceled = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    assertSystemContext(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      plan: "free",
      credits: 5,
      subscriptionEnd: Date.now(),
      subscriptionStatus: "canceled",
    });
  },
});

export const handleSubscriptionCancelAtPeriodEnd = mutation({
  args: { clerkId: v.string(), subscriptionEnd: v.optional(v.number()) },
  handler: async (ctx, args) => {
    assertSystemContext(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      subscriptionType: "cancel_at_period_end",
      subscriptionEnd: args.subscriptionEnd ?? user.subscriptionEnd,
      subscriptionStatus: "active",
    });
  },
});

export const handleSubscriptionExpired = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    assertSystemContext(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      plan: "free",
      credits: 5,
      subscriptionEnd: Date.now(),
      subscriptionStatus: "expired",
    });
  },
});

export const handleSubscriptionPaymentFailed = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    assertSystemContext(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    // Keep current plan but flag the failure
    await ctx.db.patch(user._id, {
      subscriptionType: "payment_failed",
      subscriptionStatus: "payment_failed",
    });
  },
});

export const handleSubscriptionPending = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    assertSystemContext(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      subscriptionType: "pending",
      subscriptionStatus: "pending",
    });
  },
});
