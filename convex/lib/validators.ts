import { v } from "convex/values";

export const projectSummaryValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  title: v.string(),
  roomType: v.string(),
  style: v.string(),
  beforeImageUrl: v.optional(v.string()),
  afterImageUrl: v.optional(v.string()),
  imageUrls: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const uploadDocumentValidator = v.object({
  _id: v.id("uploads"),
  _creationTime: v.number(),
  userId: v.string(),
  storageId: v.string(),
  fileName: v.string(),
  contentType: v.string(),
  fileSize: v.number(),
  createdAt: v.number(),
});

export const subscriptionStatusResultValidator = v.union(
  v.null(),
  v.object({
    plan: v.string(),
    credits: v.number(),
    subscriptionStatus: v.optional(v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("payment_failed"),
      v.literal("pending"),
    )),
    subscriptionType: v.optional(v.string()),
    subscriptionBillingInterval: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    subscriptionStartedAt: v.optional(v.number()),
    subscriptionEnd: v.optional(v.number()),
  }),
);

export const generationStatusResultValidator = v.object({
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  outputImageUrl: v.optional(v.string()),
  toolType: v.string(),
  creditsUsed: v.number(),
});
