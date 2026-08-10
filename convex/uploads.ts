import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Helper: get the verified Clerk user ID from the Convex auth context.
 * Throws if not authenticated.
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
 */
async function assertOwnership(ctx: any, clerkId: string): Promise<void> {
  const verifiedId = await getVerifiedUserId(ctx);
  if (verifiedId !== clerkId) {
    throw new Error("Unauthorized: you can only access your own uploads");
  }
}

export const saveUpload = mutation({
  args: {
    userId: v.string(),
    storageId: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.userId);

    return await ctx.db.insert("uploads", {
      userId: args.userId,
      storageId: args.storageId,
      fileName: args.fileName,
      contentType: args.contentType,
      fileSize: args.fileSize,
      createdAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getVerifiedUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await getVerifiedUserId(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getUserUploads = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await assertOwnership(ctx, args.userId);

    return await ctx.db
      .query("uploads")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const deleteUpload = mutation({
  args: {
    uploadId: v.id("uploads"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.uploadId);
    if (!upload) throw new Error("Upload not found");

    // Verify the authenticated user owns this upload
    const verifiedId = await getVerifiedUserId(ctx);
    if (upload.userId !== verifiedId) {
      throw new Error("Unauthorized: you can only delete your own uploads");
    }

    // Double-check: userId arg must match authenticated user
    if (args.userId !== verifiedId) {
      throw new Error("Unauthorized: userId does not match authenticated user");
    }

    await ctx.db.delete(args.uploadId);
  },
});
