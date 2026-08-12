import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { PLAN_CREDITS } from "./lib/plans";
import {
  boundedEmail,
  boundedString,
  finiteNumberInRange,
  optionalBoundedString,
} from "./lib/validation";

const subscriptionEvent = v.union(
  v.literal("payment.succeeded"),
  v.literal("membership.activated"),
  v.literal("invoice.paid"),
  v.literal("membership.deactivated"),
  v.literal("membership.expired"),
  v.literal("payment.failed"),
  v.literal("invoice.past.due"),
  v.literal("membership.cancel_at_period_end_changed"),
  v.literal("membership.pending"),
);

const paidPlan = v.union(
  v.literal("standard"),
  v.literal("pro"),
  v.literal("growth"),
  v.literal("scale"),
  v.literal("unlimited"),
);

function isActivationEvent(eventType: string): boolean {
  return eventType === "payment.succeeded"
    || eventType === "membership.activated"
    || eventType === "invoice.paid";
}

export const processWhopEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventCreatedAt: v.number(),
    eventType: subscriptionEvent,
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    plan: v.optional(paidPlan),
    whopCustomerId: v.optional(v.string()),
    whopSubscriptionId: v.optional(v.string()),
    subscriptionEnd: v.optional(v.number()),
  },
  returns: v.union(
    v.literal("applied"),
    v.literal("duplicate"),
    v.literal("stale"),
    v.literal("missing_user"),
  ),
  handler: async (ctx, args) => {
    const eventId = boundedString(args.eventId, "eventId", 1, 256);
    const clerkId = boundedString(args.clerkId, "clerkId", 1, 256);
    const eventCreatedAt = finiteNumberInRange(
      args.eventCreatedAt,
      "eventCreatedAt",
      1,
      Date.now() + 5 * 60 * 1000,
    );
    if (!Number.isSafeInteger(eventCreatedAt)) {
      throw new Error("eventCreatedAt must be an integer timestamp");
    }
    const whopCustomerId = optionalBoundedString(
      args.whopCustomerId,
      "whopCustomerId",
      256,
    );
    const whopSubscriptionId = optionalBoundedString(
      args.whopSubscriptionId,
      "whopSubscriptionId",
      256,
    );

    const duplicate = await ctx.db
      .query("webhookEvents")
      .withIndex("by_provider_and_eventId", (q) =>
        q.eq("provider", "whop").eq("eventId", eventId),
      )
      .unique();
    if (duplicate) return "duplicate" as const;

    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user && isActivationEvent(args.eventType)) {
      if (!args.plan) throw new Error("A known paid plan is required for activation");
      const email = args.email === undefined ? undefined : boundedEmail(args.email);
      const name = optionalBoundedString(args.name, "name", 120);
      const userId = await ctx.db.insert("users", {
        clerkId,
        email,
        name,
        credits: PLAN_CREDITS.free,
        plan: "free",
        createdAt: Date.now(),
        lastClaimAt: Date.now(),
        proTrialExpiresAt: 0,
      });
      user = await ctx.db.get("users", userId);
    }

    if (!user) {
      await ctx.db.insert("webhookEvents", {
        provider: "whop",
        eventId,
        eventType: args.eventType,
        eventCreatedAt,
        receivedAt: Date.now(),
        outcome: "ignored_missing_user",
      });
      return "missing_user" as const;
    }

    const lastAt = user.lastSubscriptionEventAt;
    const lastId = user.lastSubscriptionEventId;
    const stale = lastAt !== undefined && (
      eventCreatedAt < lastAt
      || (eventCreatedAt === lastAt && lastId !== undefined && eventId <= lastId)
    );
    if (stale) {
      await ctx.db.insert("webhookEvents", {
        provider: "whop",
        eventId,
        eventType: args.eventType,
        eventCreatedAt,
        receivedAt: Date.now(),
        outcome: "ignored_stale",
      });
      return "stale" as const;
    }

    const eventMarker = {
      lastSubscriptionEventAt: eventCreatedAt,
      lastSubscriptionEventId: eventId,
    };
    if (isActivationEvent(args.eventType)) {
      if (!args.plan) throw new Error("A known paid plan is required for activation");
      await ctx.db.patch("users", user._id, {
        ...eventMarker,
        plan: args.plan,
        credits: PLAN_CREDITS[args.plan],
        whopCustomerId: whopCustomerId ?? user.whopCustomerId,
        whopSubscriptionId: whopSubscriptionId ?? user.whopSubscriptionId,
        subscriptionStartedAt: eventCreatedAt,
        subscriptionEnd: undefined,
        subscriptionType: "active",
        subscriptionStatus: "active",
        lastResetDate: eventCreatedAt,
      });
    } else if (args.eventType === "membership.deactivated") {
      await ctx.db.patch("users", user._id, {
        ...eventMarker,
        plan: "free",
        credits: PLAN_CREDITS.free,
        subscriptionEnd: eventCreatedAt,
        subscriptionType: undefined,
        subscriptionStatus: "canceled",
      });
    } else if (args.eventType === "membership.expired") {
      await ctx.db.patch("users", user._id, {
        ...eventMarker,
        plan: "free",
        credits: PLAN_CREDITS.free,
        subscriptionEnd: eventCreatedAt,
        subscriptionType: undefined,
        subscriptionStatus: "expired",
      });
    } else if (args.eventType === "membership.cancel_at_period_end_changed") {
      const subscriptionEnd = args.subscriptionEnd === undefined
        ? user.subscriptionEnd
        : finiteNumberInRange(
          args.subscriptionEnd,
          "subscriptionEnd",
          1,
          Number.MAX_SAFE_INTEGER,
        );
      await ctx.db.patch("users", user._id, {
        ...eventMarker,
        subscriptionType: "cancel_at_period_end",
        subscriptionEnd,
        subscriptionStatus: "active",
      });
    } else if (args.eventType === "payment.failed" || args.eventType === "invoice.past.due") {
      await ctx.db.patch("users", user._id, {
        ...eventMarker,
        subscriptionType: "payment_failed",
        subscriptionStatus: "payment_failed",
      });
    } else {
      await ctx.db.patch("users", user._id, {
        ...eventMarker,
        subscriptionType: "pending",
        subscriptionStatus: "pending",
      });
    }

    await ctx.db.insert("webhookEvents", {
      provider: "whop",
      eventId,
      eventType: args.eventType,
      eventCreatedAt,
      receivedAt: Date.now(),
      outcome: "applied",
    });
    return "applied" as const;
  },
});
