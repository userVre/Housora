import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  assertOwnClerkId,
  findUserForIdentity,
  requireIdentity,
  requireUser,
} from "./lib/auth";
import { PLAN_CREDITS } from "./lib/plans";
import {
  boundedString,
  boundedEmail,
  optionalBoundedString,
  positiveSafeInteger,
} from "./lib/validation";
import {
  generationStatusResultValidator,
  subscriptionStatusResultValidator,
} from "./lib/validators";

const GENERATION_COST = 1;
const GENERATION_TIMEOUT_MS = 30 * 60 * 1000;

export const getCredits = query({
  // Kept for compatibility with the current browser; never used as authority.
  args: { clerkId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    assertOwnClerkId(identity, boundedString(args.clerkId, "clerkId", 1, 256));
    const user = await findUserForIdentity(ctx, identity);
    if (user?.deletionRequestedAt !== undefined) return 0;
    return user?.credits ?? 0;
  },
});

export const getSubscriptionStatus = query({
  // Kept for compatibility with the current browser; never used as authority.
  args: { clerkId: v.string() },
  returns: subscriptionStatusResultValidator,
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    assertOwnClerkId(identity, boundedString(args.clerkId, "clerkId", 1, 256));
    const user = await findUserForIdentity(ctx, identity);
    if (!user || user.deletionRequestedAt !== undefined) return null;

    return {
      plan: user.plan ?? "free",
      credits: user.credits,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionType: user.subscriptionType,
      subscriptionBillingInterval: user.subscriptionBillingInterval,
      subscriptionStartedAt: user.subscriptionStartedAt,
      subscriptionEnd: user.subscriptionEnd,
    };
  },
});

/** Creates or refreshes only the signed-in user's non-billing profile fields. */
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    assertOwnClerkId(identity, boundedString(args.clerkId, "clerkId", 1, 256));
    const email = boundedEmail(identity.email ?? args.email);
    const name = optionalBoundedString(identity.name ?? args.name, "name", 120);
    const existing = await findUserForIdentity(ctx, identity);

    if (existing) {
      if (existing.deletionRequestedAt !== undefined) {
        throw new Error("Account deletion is in progress");
      }
      await ctx.db.patch("users", existing._id, {
        authId: identity.tokenIdentifier,
        clerkId: identity.subject,
        email,
        name: name ?? existing.name,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      authId: identity.tokenIdentifier,
      clerkId: identity.subject,
      email,
      name,
      credits: PLAN_CREDITS.free,
      plan: "free",
      createdAt: Date.now(),
      lastClaimAt: Date.now(),
      proTrialExpiresAt: 0,
    });
  },
});

export const deductCredits = internalMutation({
  args: {
    eventId: v.string(),
    clerkId: v.string(),
    amount: v.number(),
    toolType: v.literal("design"),
    projectId: v.optional(v.id("projects")),
    inputStorageId: v.optional(v.id("_storage")),
  },
  returns: v.object({
    generationId: v.id("generations"),
    remainingCredits: v.number(),
  }),
  handler: async (ctx, args) => {
    const eventId = boundedString(args.eventId, "eventId", 1, 256);
    const clerkId = boundedString(args.clerkId, "clerkId", 1, 256);
    const duplicate = await ctx.db
      .query("generationEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
      .unique();
    if (duplicate) {
      if (duplicate.userId !== clerkId) throw new Error("Invalid generation event");
      return {
        generationId: duplicate.generationId,
        remainingCredits: duplicate.remainingCredits,
      };
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user || user.deletionRequestedAt !== undefined) throw new Error("User not found");
    const ownerId = clerkId;
    const amount = positiveSafeInteger(args.amount, "amount", GENERATION_COST);
    if (amount !== GENERATION_COST) throw new Error("Invalid generation credit cost");
    if (!Number.isSafeInteger(user.credits) || user.credits < 0) {
      throw new Error("Account credit balance is invalid");
    }
    if (user.credits < amount) throw new Error("Insufficient credits");

    if (args.projectId !== undefined) {
      const project = await ctx.db.get("projects", args.projectId);
      if (!project || project.userId !== ownerId) throw new Error("Project not found");
    }
    if (args.inputStorageId !== undefined) {
      const upload = await ctx.db
        .query("uploads")
        .withIndex("by_storageId", (q) => q.eq("storageId", args.inputStorageId!))
        .unique();
      if (!upload || upload.userId !== ownerId) throw new Error("Uploaded file not found");
    }

    const remainingCredits = user.credits - amount;
    await ctx.db.patch("users", user._id, { credits: remainingCredits });
    const generationId = await ctx.db.insert("generations", {
      userId: ownerId,
      projectId: args.projectId,
      toolType: args.toolType,
      inputStorageId: args.inputStorageId,
      creditsUsed: amount,
      status: "pending",
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(
      GENERATION_TIMEOUT_MS,
      internal.users.expireGeneration,
      { generationId },
    );
    await ctx.db.insert("generationEvents", {
      userId: ownerId,
      eventId,
      generationId,
      remainingCredits,
      createdAt: Date.now(),
    });
    return { generationId, remainingCredits };
  },
});

export const getGenerationStatus = query({
  args: { generationId: v.id("generations") },
  returns: generationStatusResultValidator,
  handler: async (ctx, args) => {
    const { ownerId } = await requireUser(ctx);
    const generation = await ctx.db.get("generations", args.generationId);
    if (!generation || generation.userId !== ownerId) {
      throw new Error("Generation not found");
    }
    const storedOutputUrl = generation.outputStorageId
      ? await ctx.storage.getUrl(generation.outputStorageId)
      : null;
    return {
      status: generation.status,
      outputImageUrl: storedOutputUrl ?? generation.outputImageUrl,
      toolType: generation.toolType,
      creditsUsed: generation.creditsUsed,
    };
  },
});

// These state transitions are intentionally internal. Only trusted server-side
// generation orchestration may invoke them.
export const markGenerationProcessing = internalMutation({
  args: { generationId: v.id("generations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const generation = await ctx.db.get("generations", args.generationId);
    if (!generation) throw new Error("Generation not found");
    if (generation.status === "processing") return null;
    if (generation.status !== "pending") {
      throw new Error(`Invalid generation transition from ${generation.status} to processing`);
    }
    await ctx.db.patch("generations", args.generationId, {
      status: "processing",
      processingAt: Date.now(),
    });
    return null;
  },
});

export const completeGeneration = internalMutation({
  args: {
    generationId: v.id("generations"),
    outputStorageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const generation = await ctx.db.get("generations", args.generationId);
    if (!generation) throw new Error("Generation not found");
    if (generation.status === "completed") {
      if (generation.outputStorageId !== args.outputStorageId) {
        throw new Error("Generation was already completed with a different output");
      }
      return null;
    }
    if (generation.status !== "pending" && generation.status !== "processing") {
      throw new Error(`Invalid generation transition from ${generation.status} to completed`);
    }
    if (args.outputStorageId !== undefined) {
      const upload = await ctx.db
        .query("uploads")
        .withIndex("by_storageId", (q) => q.eq("storageId", args.outputStorageId!))
        .unique();
      if (!upload || upload.userId !== generation.userId) {
        throw new Error("Uploaded file not found");
      }
    }
    await ctx.db.patch("generations", args.generationId, {
      status: "completed",
      outputStorageId: args.outputStorageId,
      completedAt: Date.now(),
    });
    return null;
  },
});

export const failGeneration = internalMutation({
  args: {
    generationId: v.id("generations"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reason = optionalBoundedString(args.reason, "reason", 500);
    const generation = await ctx.db.get("generations", args.generationId);
    if (!generation) throw new Error("Generation not found");
    if (generation.status === "failed") return null;
    if (generation.status !== "pending" && generation.status !== "processing") {
      throw new Error(`Invalid generation transition from ${generation.status} to failed`);
    }

    const creditsUsed = positiveSafeInteger(
      generation.creditsUsed,
      "generation creditsUsed",
      GENERATION_COST,
    );
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", generation.userId))
      .unique();
    if (!user) throw new Error("Generation owner not found");
    if (!Number.isSafeInteger(user.credits) || user.credits < 0) {
      throw new Error("Account credit balance is invalid");
    }

    const now = Date.now();
    await ctx.db.patch("generations", args.generationId, {
      status: "failed",
      failureReason: reason,
      failedAt: now,
      refundedAt: now,
    });
    await ctx.db.patch("users", user._id, { credits: user.credits + creditsUsed });
    return null;
  },
});

/** Refunds an abandoned reservation if the generation orchestrator never finishes it. */
export const expireGeneration = internalMutation({
  args: { generationId: v.id("generations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const generation = await ctx.db.get("generations", args.generationId);
    if (!generation || generation.status === "completed" || generation.status === "failed") {
      return null;
    }

    const creditsUsed = positiveSafeInteger(
      generation.creditsUsed,
      "generation creditsUsed",
      GENERATION_COST,
    );
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", generation.userId))
      .unique();
    if (!user) return null;
    if (!Number.isSafeInteger(user.credits) || user.credits < 0) {
      throw new Error("Account credit balance is invalid");
    }

    const now = Date.now();
    await ctx.db.patch("generations", args.generationId, {
      status: "failed",
      failureReason: "generation_timeout",
      failedAt: now,
      refundedAt: now,
    });
    await ctx.db.patch("users", user._id, { credits: user.credits + creditsUsed });
    return null;
  },
});
