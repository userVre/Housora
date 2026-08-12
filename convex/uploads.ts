import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { boundedString, positiveSafeInteger } from "./lib/validation";
import { uploadDocumentValidator } from "./lib/validators";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_UPLOADS_RETURNED = 100;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Claims an uploaded blob for the current user after verifying its real metadata. */
export const saveUpload = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  returns: v.id("uploads"),
  handler: async (ctx, args) => {
    const { ownerId } = await requireUser(ctx);
    const fileName = boundedString(args.fileName, "fileName", 1, 255);
    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) throw new Error("Uploaded file not found");
    if (!metadata.contentType || !ALLOWED_IMAGE_TYPES.has(metadata.contentType)) {
      throw new Error("Only supported image uploads are allowed");
    }
    positiveSafeInteger(metadata.size, "fileSize", MAX_UPLOAD_BYTES);

    const existing = await ctx.db
      .query("uploads")
      .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (existing) {
      if (existing.userId !== ownerId) throw new Error("Uploaded file not found");
      return existing._id;
    }

    return await ctx.db.insert("uploads", {
      userId: ownerId,
      storageId: args.storageId,
      fileName,
      contentType: metadata.contentType,
      fileSize: metadata.size,
      createdAt: Date.now(),
    });
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const { ownerId } = await requireUser(ctx);
    const upload = await ctx.db
      .query("uploads")
      .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (!upload || upload.userId !== ownerId) throw new Error("Uploaded file not found");
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getUserUploads = query({
  args: {},
  returns: v.array(uploadDocumentValidator),
  handler: async (ctx) => {
    const { ownerId } = await requireUser(ctx);
    return await ctx.db
      .query("uploads")
      .withIndex("by_userId", (q) => q.eq("userId", ownerId))
      .order("desc")
      .take(MAX_UPLOADS_RETURNED);
  },
});

export const deleteUpload = mutation({
  args: { uploadId: v.id("uploads") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { ownerId } = await requireUser(ctx);
    const upload = await ctx.db.get("uploads", args.uploadId);
    if (!upload || upload.userId !== ownerId) throw new Error("Upload not found");

    const storageId = ctx.db.system.normalizeId("_storage", upload.storageId);
    const metadata = storageId
      ? await ctx.db.system.get("_storage", storageId)
      : null;
    if (metadata && storageId) await ctx.storage.delete(storageId);
    await ctx.db.delete("uploads", args.uploadId);
    return null;
  },
});
