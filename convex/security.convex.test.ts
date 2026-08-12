/// <reference types="vite/client" />
import { makeFunctionReference } from "convex/server";
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import * as userFunctions from "./users";

const modules = import.meta.glob([
  "./**/*.ts",
  "!./**/*.test.ts",
  "!./_generated/ai/**",
]);

const aliceIdentity = {
  subject: "alice",
  issuer: "https://clerk.example",
  tokenIdentifier: "https://clerk.example|alice",
  email: "alice@example.com",
};
const bobIdentity = {
  subject: "bob",
  issuer: "https://clerk.example",
  tokenIdentifier: "https://clerk.example|bob",
  email: "bob@example.com",
};

async function createUsers() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const bob = t.withIdentity(bobIdentity);
  await alice.mutation(api.users.createOrUpdateUser, {
    clerkId: "alice",
    email: "alice@example.com",
  });
  await bob.mutation(api.users.createOrUpdateUser, {
    clerkId: "bob",
    email: "bob@example.com",
  });
  return { t, alice, bob };
}

describe("Convex authorization and billing invariants", () => {
  test("public clients cannot upgrade plans or add credits", async () => {
    const { alice } = await createUsers();
    const updatePlan = makeFunctionReference<
      "mutation",
      { clerkId: string; plan: string },
      unknown
    >("users:updatePlan");
    const addCredits = makeFunctionReference<
      "mutation",
      { clerkId: string; amount: number },
      unknown
    >("users:addCredits");

    await expect(alice.mutation(updatePlan, { clerkId: "alice", plan: "pro" }))
      .rejects.toThrow();
    await expect(alice.mutation(addCredits, { clerkId: "alice", amount: 1_000 }))
      .rejects.toThrow();
    expect(userFunctions.deductCredits.isInternal).toBe(true);
    expect(userFunctions.deductCredits.isPublic).toBeUndefined();
    await expect(alice.query(api.users.getCredits, { clerkId: "alice" }))
      .resolves.toBe(5);
  });

  test("negative, fractional, non-finite, and excessive deductions are rejected", async () => {
    const { t, alice } = await createUsers();
    for (const amount of [-1, 0, 0.5, 2, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(t.mutation(internal.users.deductCredits, {
        eventId: `evt_invalid_${String(amount)}`,
        clerkId: "alice",
        amount,
        toolType: "design",
      })).rejects.toThrow();
    }
    await expect(alice.query(api.users.getCredits, { clerkId: "alice" }))
      .resolves.toBe(5);
  });

  test("another user's projects, generations, and storage are inaccessible", async () => {
    const { t, alice, bob } = await createUsers();
    const projectId = await alice.mutation(api.projects.createProject, {
      title: "Alice room",
      roomType: "Living Room",
      style: "Modern",
    });
    const reservation = await t.mutation(internal.users.deductCredits, {
      eventId: "evt_alice_owned_generation",
      clerkId: "alice",
      amount: 1,
      toolType: "design",
      projectId,
    });
    const storageId = await t.run(async (ctx) =>
      await ctx.storage.store(new Blob(["image"], { type: "image/png" })),
    );
    await t.run(async (ctx) => await ctx.db.insert("uploads", {
      userId: "alice",
      storageId,
      fileName: "room.png",
      contentType: "image/png",
      fileSize: 5,
      createdAt: 1_700_000_000_000,
    }));

    await expect(bob.mutation(api.projects.updateProject, {
      projectId,
      title: "Stolen",
    })).rejects.toThrow(/Project not found/);
    await expect(bob.query(api.users.getGenerationStatus, {
      generationId: reservation.generationId,
    })).rejects.toThrow(/Generation not found/);
    await expect(bob.query(api.uploads.getStorageUrl, { storageId }))
      .rejects.toThrow(/Uploaded file not found/);
  });

  test("duplicate and stale subscription events cannot grant credits twice", async () => {
    const { t, alice } = await createUsers();
    const event = {
      eventId: "evt_standard_1",
      eventCreatedAt: 1_700_000_000_000,
      eventType: "payment.succeeded" as const,
      clerkId: "alice",
      plan: "standard" as const,
    };
    await expect(t.mutation(internal.subscriptions.processWhopEvent, event))
      .resolves.toBe("applied");
    await expect(t.mutation(internal.subscriptions.processWhopEvent, event))
      .resolves.toBe("duplicate");
    await expect(t.mutation(internal.subscriptions.processWhopEvent, {
      ...event,
      eventId: "evt_older_pro",
      eventCreatedAt: event.eventCreatedAt - 1,
      plan: "pro",
    })).resolves.toBe("stale");
    await expect(alice.query(api.users.getCredits, { clerkId: "alice" }))
      .resolves.toBe(100);
    const events = await t.run(async (ctx) =>
      await ctx.db.query("webhookEvents").take(10),
    );
    expect(events).toHaveLength(2);
  });

  test("clients cannot complete or refund and internal refunds happen once", async () => {
    const { t, alice } = await createUsers();
    const reservation = await t.mutation(internal.users.deductCredits, {
      eventId: "evt_refund_once",
      clerkId: "alice",
      amount: 1,
      toolType: "design",
    });
    expect(userFunctions.completeGeneration.isInternal).toBe(true);
    expect(userFunctions.completeGeneration.isPublic).toBeUndefined();
    expect(userFunctions.failGeneration.isInternal).toBe(true);
    expect(userFunctions.failGeneration.isPublic).toBeUndefined();
    await t.mutation(internal.users.failGeneration, {
      generationId: reservation.generationId,
      reason: "provider_failure",
    });
    await t.mutation(internal.users.failGeneration, {
      generationId: reservation.generationId,
      reason: "provider_failure",
    });
    await expect(alice.query(api.users.getCredits, { clerkId: "alice" }))
      .resolves.toBe(5);
  });

  test("duplicate generation reservation callbacks deduct only once", async () => {
    const { t, alice } = await createUsers();
    const args = {
      eventId: "evt_generation_reserve_replay",
      clerkId: "alice",
      amount: 1,
      toolType: "design" as const,
    };
    const first = await t.mutation(internal.users.deductCredits, args);
    const duplicate = await t.mutation(internal.users.deductCredits, args);
    expect(duplicate).toEqual(first);
    await expect(alice.query(api.users.getCredits, { clerkId: "alice" }))
      .resolves.toBe(4);
    const rows = await t.run(async (ctx) => ({
      generations: await ctx.db.query("generations").take(10),
      events: await ctx.db.query("generationEvents").take(10),
    }));
    expect(rows.generations).toHaveLength(1);
    expect(rows.events).toHaveLength(1);
  });

  test("account deletion removes only the owner's rows and storage", async () => {
    const { t, alice, bob } = await createUsers();
    await alice.mutation(api.projects.createProject, {
      title: "Alice room",
      roomType: "Living Room",
      style: "Modern",
    });
    await bob.mutation(api.projects.createProject, {
      title: "Bob room",
      roomType: "Bedroom",
      style: "Classic",
    });
    await t.mutation(internal.users.deductCredits, {
      eventId: "evt_delete_alice",
      clerkId: "alice",
      amount: 1,
      toolType: "design",
    });
    await t.mutation(internal.users.deductCredits, {
      eventId: "evt_delete_bob",
      clerkId: "bob",
      amount: 1,
      toolType: "design",
    });
    const aliceStorageId = await t.run(async (ctx) =>
      await ctx.storage.store(new Blob(["alice"], { type: "image/png" })),
    );
    const bobStorageId = await t.run(async (ctx) =>
      await ctx.storage.store(new Blob(["bob"], { type: "image/png" })),
    );
    await t.run(async (ctx) => {
      await ctx.db.insert("uploads", {
        userId: "alice",
        storageId: aliceStorageId,
        fileName: "alice.png",
        contentType: "image/png",
        fileSize: 5,
        createdAt: 1_700_000_000_000,
      });
      await ctx.db.insert("uploads", {
        userId: "bob",
        storageId: bobStorageId,
        fileName: "bob.png",
        contentType: "image/png",
        fileSize: 3,
        createdAt: 1_700_000_000_001,
      });
    });

    await expect(alice.mutation(api.accountDeletion.deleteAccount, {}))
      .resolves.toEqual({ complete: true });
    const state = await t.run(async (ctx) => ({
      aliceUser: await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "alice"))
        .unique(),
      bobUser: await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", "bob"))
        .unique(),
      aliceProjects: await ctx.db
        .query("projects")
        .withIndex("by_userId", (q) => q.eq("userId", "alice"))
        .take(10),
      bobProjects: await ctx.db
        .query("projects")
        .withIndex("by_userId", (q) => q.eq("userId", "bob"))
        .take(10),
      aliceGenerations: await ctx.db
        .query("generations")
        .withIndex("by_userId", (q) => q.eq("userId", "alice"))
        .take(10),
      bobGenerations: await ctx.db
        .query("generations")
        .withIndex("by_userId", (q) => q.eq("userId", "bob"))
        .take(10),
      aliceGenerationEvents: await ctx.db
        .query("generationEvents")
        .withIndex("by_userId", (q) => q.eq("userId", "alice"))
        .take(10),
      bobGenerationEvents: await ctx.db
        .query("generationEvents")
        .withIndex("by_userId", (q) => q.eq("userId", "bob"))
        .take(10),
      aliceUploads: await ctx.db
        .query("uploads")
        .withIndex("by_userId", (q) => q.eq("userId", "alice"))
        .take(10),
      bobUploads: await ctx.db
        .query("uploads")
        .withIndex("by_userId", (q) => q.eq("userId", "bob"))
        .take(10),
      aliceStorage: await ctx.db.system.get("_storage", aliceStorageId),
      bobStorage: await ctx.db.system.get("_storage", bobStorageId),
    }));
    expect(state.aliceUser).toBeNull();
    expect(state.bobUser).not.toBeNull();
    expect(state.aliceProjects).toHaveLength(0);
    expect(state.bobProjects).toHaveLength(1);
    expect(state.aliceGenerations).toHaveLength(0);
    expect(state.bobGenerations).toHaveLength(1);
    expect(state.aliceGenerationEvents).toHaveLength(0);
    expect(state.bobGenerationEvents).toHaveLength(1);
    expect(state.aliceUploads).toHaveLength(0);
    expect(state.bobUploads).toHaveLength(1);
    expect(state.aliceStorage).toBeNull();
    expect(state.bobStorage).not.toBeNull();
  });

  test("signed Clerk deletion events are idempotent", async () => {
    const { t } = await createUsers();
    const deletion = {
      clerkId: "alice",
      eventId: "evt_clerk_delete_alice",
      eventCreatedAt: 1_700_000_000_000,
    };
    await expect(t.mutation(
      internal.accountDeletion.startAccountDeletionFromClerk,
      deletion,
    )).resolves.toBe("applied");
    await expect(t.mutation(
      internal.accountDeletion.startAccountDeletionFromClerk,
      deletion,
    )).resolves.toBe("duplicate");
    const user = await t.run(async (ctx) => await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", "alice"))
      .unique());
    expect(user).toBeNull();
  });
});
