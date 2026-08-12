import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const subscriptionStatus = v.union(
  v.literal("active"),
  v.literal("canceled"),
  v.literal("expired"),
  v.literal("payment_failed"),
  v.literal("pending"),
);

export default defineSchema({
  users: defineTable({
    anonymousId: v.optional(v.string()),
    // Canonical auth key. clerkId remains for webhook correlation and migration.
    authId: v.optional(v.string()),
    canClaimDiamond: v.optional(v.boolean()),
    clerkId: v.optional(v.string()),
    credits: v.number(),
    deletionRequestedAt: v.optional(v.number()),
    diamondBalance: v.optional(v.number()),
    diamondSources: v.optional(v.array(v.string())),
    eliteProUntil: v.optional(v.number()),
    email: v.optional(v.string()),
    firstDiamondRatingPromptedAt: v.optional(v.number()),
    firstEntryRewardDismissedAt: v.optional(v.number()),
    generationCount: v.optional(v.number()),
    imageGenerationCount: v.optional(v.number()),
    imageLimit: v.optional(v.number()),
    lastClaimAt: v.optional(v.number()),
    lastClaimDate: v.optional(v.number()),
    lastLoginDate: v.optional(v.number()),
    lastResetDate: v.optional(v.number()),
    lastReviewPromptAt: v.optional(v.number()),
    lastRewardDate: v.optional(v.number()),
    lastSubscriptionEventAt: v.optional(v.number()),
    lastSubscriptionEventId: v.optional(v.string()),
    name: v.optional(v.string()),
    nextDiamondClaimAt: v.optional(v.number()),
    notificationsDeclined: v.optional(v.boolean()),
    notificationsPermissionGrantedAt: v.optional(v.number()),
    notificationsPermissionRequestedAt: v.optional(v.number()),
    onboardingDiamondClaimedAt: v.optional(v.number()),
    // Kept broad for legacy rows; all writers validate against `plan` enums.
    plan: v.optional(v.string()),
    premiumCredits: v.optional(v.number()),
    proTipNotificationIndex: v.optional(v.number()),
    proTrialEndedPaywallPending: v.optional(v.boolean()),
    proTrialEndedPaywallShownAt: v.optional(v.number()),
    proTrialExpiresAt: v.number(),
    referralCode: v.optional(v.string()),
    referralCount: v.optional(v.number()),
    referralProCount: v.optional(v.number()),
    reviewPrompted: v.optional(v.boolean()),
    streakCount: v.optional(v.number()),
    subscriptionEnd: v.optional(v.number()),
    subscriptionEntitlement: v.optional(v.string()),
    subscriptionStartedAt: v.optional(v.number()),
    // Kept broad for legacy rows; all current writers use a closed enum.
    subscriptionType: v.optional(v.string()),
    subscriptionStatus: v.optional(subscriptionStatus),
    welcomeDiamondGiven: v.optional(v.boolean()),
    whopCustomerId: v.optional(v.string()),
    whopSubscriptionId: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  })
    .index("by_authId", ["authId"])
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  projects: defineTable({
    userId: v.string(),
    title: v.string(),
    roomType: v.string(),
    style: v.string(),
    beforeImageUrl: v.optional(v.string()),
    afterImageUrl: v.optional(v.string()),
    beforeImageStorageId: v.optional(v.id("_storage")),
    afterImageStorageId: v.optional(v.id("_storage")),
    prompt: v.optional(v.string()),
    budget: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  generations: defineTable({
    userId: v.string(),
    // Existing rows used strings. Public writers now accept only project IDs.
    projectId: v.optional(v.string()),
    // Existing rows may name retired tools. New reservations accept only "design".
    toolType: v.string(),
    creditsUsed: v.number(),
    inputImageUrl: v.optional(v.string()),
    outputImageUrl: v.optional(v.string()),
    inputStorageId: v.optional(v.id("_storage")),
    outputStorageId: v.optional(v.id("_storage")),
    prompt: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    failureReason: v.optional(v.string()),
    processingAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  generationEvents: defineTable({
    userId: v.string(),
    eventId: v.string(),
    generationId: v.id("generations"),
    remainingCredits: v.number(),
    createdAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_userId", ["userId"]),

  uploads: defineTable({
    userId: v.string(),
    // Existing rows used strings. New saveUpload calls accept only storage IDs.
    storageId: v.string(),
    fileName: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_storageId", ["storageId"]),

  webhookEvents: defineTable({
    provider: v.union(v.literal("whop"), v.literal("clerk")),
    eventId: v.string(),
    eventType: v.string(),
    eventCreatedAt: v.number(),
    receivedAt: v.number(),
    outcome: v.union(
      v.literal("applied"),
      v.literal("ignored_stale"),
      v.literal("ignored_missing_user"),
    ),
  }).index("by_provider_and_eventId", ["provider", "eventId"]),
});
