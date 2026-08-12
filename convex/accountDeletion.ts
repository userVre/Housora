import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation } from "./_generated/server";
import { findUserForIdentity, requireIdentity } from "./lib/auth";
import { boundedString, finiteNumberInRange } from "./lib/validation";

const DELETE_BATCH_SIZE = 50;

async function deleteCascadeBatch(
  ctx: MutationCtx,
  userId: Id<"users">,
  ownerId: string,
): Promise<boolean> {
  const projects = await ctx.db
    .query("projects")
    .withIndex("by_userId", (q) => q.eq("userId", ownerId))
    .take(DELETE_BATCH_SIZE);
  const generations = await ctx.db
    .query("generations")
    .withIndex("by_userId", (q) => q.eq("userId", ownerId))
    .take(DELETE_BATCH_SIZE);
  const uploads = await ctx.db
    .query("uploads")
    .withIndex("by_userId", (q) => q.eq("userId", ownerId))
    .take(DELETE_BATCH_SIZE);
  const generationEvents = await ctx.db
    .query("generationEvents")
    .withIndex("by_userId", (q) => q.eq("userId", ownerId))
    .take(DELETE_BATCH_SIZE);

  for (const project of projects) await ctx.db.delete("projects", project._id);
  for (const generation of generations) {
    await ctx.db.delete("generations", generation._id);
  }
  for (const event of generationEvents) {
    await ctx.db.delete("generationEvents", event._id);
  }
  for (const upload of uploads) {
    const storageId = ctx.db.system.normalizeId("_storage", upload.storageId);
    const metadata = storageId
      ? await ctx.db.system.get("_storage", storageId)
      : null;
    if (metadata && storageId) await ctx.storage.delete(storageId);
    await ctx.db.delete("uploads", upload._id);
  }

  const mayHaveMore = projects.length === DELETE_BATCH_SIZE
    || generations.length === DELETE_BATCH_SIZE
    || generationEvents.length === DELETE_BATCH_SIZE
    || uploads.length === DELETE_BATCH_SIZE;
  if (mayHaveMore) {
    await ctx.scheduler.runAfter(0, internal.accountDeletion.continueAccountDeletion, {
      userId,
      ownerId,
    });
    return false;
  }

  const user = await ctx.db.get("users", userId);
  if (user) await ctx.db.delete("users", userId);
  return true;
}

export const deleteAccount = mutation({
  args: {},
  returns: v.object({ complete: v.boolean() }),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const user = await findUserForIdentity(ctx, identity);
    if (!user) return { complete: true };
    const ownerId = user.clerkId ?? identity.subject;
    if (user.deletionRequestedAt === undefined) {
      await ctx.db.patch("users", user._id, { deletionRequestedAt: Date.now() });
    }
    const complete = await deleteCascadeBatch(ctx, user._id, ownerId);
    return { complete };
  },
});

export const continueAccountDeletion = internalMutation({
  args: {
    userId: v.id("users"),
    ownerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get("users", args.userId);
    if (!user) return null;
    if (
      user.deletionRequestedAt === undefined
      || (user.clerkId !== undefined && user.clerkId !== args.ownerId)
    ) {
      throw new Error("Invalid account deletion continuation");
    }
    await deleteCascadeBatch(ctx, args.userId, args.ownerId);
    return null;
  },
});

export const startAccountDeletionFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    eventId: v.string(),
    eventCreatedAt: v.number(),
  },
  returns: v.union(
    v.literal("applied"),
    v.literal("duplicate"),
    v.literal("missing_user"),
  ),
  handler: async (ctx, args) => {
    const clerkId = boundedString(args.clerkId, "clerkId", 1, 256);
    const eventId = boundedString(args.eventId, "eventId", 1, 256);
    const eventCreatedAt = finiteNumberInRange(
      args.eventCreatedAt,
      "eventCreatedAt",
      1,
      Date.now() + 5 * 60 * 1000,
    );
    if (!Number.isSafeInteger(eventCreatedAt)) {
      throw new Error("eventCreatedAt must be an integer timestamp");
    }

    const duplicate = await ctx.db
      .query("webhookEvents")
      .withIndex("by_provider_and_eventId", (q) =>
        q.eq("provider", "clerk").eq("eventId", eventId),
      )
      .unique();
    if (duplicate) return "duplicate" as const;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) {
      await ctx.db.insert("webhookEvents", {
        provider: "clerk",
        eventId,
        eventType: "user.deleted",
        eventCreatedAt,
        receivedAt: Date.now(),
        outcome: "ignored_missing_user",
      });
      return "missing_user" as const;
    }

    if (user.deletionRequestedAt === undefined) {
      await ctx.db.patch("users", user._id, { deletionRequestedAt: Date.now() });
    }
    await ctx.db.insert("webhookEvents", {
      provider: "clerk",
      eventId,
      eventType: "user.deleted",
      eventCreatedAt,
      receivedAt: Date.now(),
      outcome: "applied",
    });
    await deleteCascadeBatch(ctx, user._id, user.clerkId ?? clerkId);
    return "applied" as const;
  },
});
