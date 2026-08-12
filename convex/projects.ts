import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { findUserForIdentity, requireIdentity, requireUser } from "./lib/auth";
import {
  boundedString,
  finiteNumberInRange,
  optionalBoundedString,
} from "./lib/validation";
import { projectSummaryValidator } from "./lib/validators";

const MAX_PROJECTS_RETURNED = 100;

async function requireOwnedUpload(
  ctx: MutationCtx,
  ownerId: string,
  storageId: Id<"_storage">,
): Promise<void> {
  const upload = await ctx.db
    .query("uploads")
    .withIndex("by_storageId", (q) => q.eq("storageId", storageId))
    .unique();
  if (!upload || upload.userId !== ownerId) throw new Error("Uploaded file not found");
}

export const listProjects = query({
  args: {},
  returns: v.array(projectSummaryValidator),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const user = await findUserForIdentity(ctx, identity);
    if (user?.deletionRequestedAt !== undefined) return [];
    const ownerId = user?.clerkId ?? identity.subject;

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", ownerId))
      .order("desc")
      .take(MAX_PROJECTS_RETURNED);
    return await Promise.all(projects.map(async (project) => {
      const beforeImageUrl = project.beforeImageStorageId
        ? await ctx.storage.getUrl(project.beforeImageStorageId)
        : project.beforeImageUrl;
      const afterImageUrl = project.afterImageStorageId
        ? await ctx.storage.getUrl(project.afterImageStorageId)
        : project.afterImageUrl;
      return {
        _id: project._id,
        _creationTime: project._creationTime,
        title: project.title,
        roomType: project.roomType,
        style: project.style,
        beforeImageUrl: beforeImageUrl ?? undefined,
        afterImageUrl: afterImageUrl ?? undefined,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    }));
  },
});

export const createProject = mutation({
  args: {
    title: v.string(),
    roomType: v.string(),
    style: v.string(),
    beforeImageStorageId: v.optional(v.id("_storage")),
    prompt: v.optional(v.string()),
    budget: v.optional(v.number()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const { ownerId } = await requireUser(ctx);
    const title = boundedString(args.title, "title", 1, 120);
    const roomType = boundedString(args.roomType, "roomType", 1, 80);
    const style = boundedString(args.style, "style", 1, 80);
    if (args.beforeImageStorageId !== undefined) {
      await requireOwnedUpload(ctx, ownerId, args.beforeImageStorageId);
    }
    const prompt = optionalBoundedString(args.prompt, "prompt", 4_000);
    const budget = args.budget === undefined
      ? undefined
      : finiteNumberInRange(args.budget, "budget", 0, 100_000_000);
    const now = Date.now();

    return await ctx.db.insert("projects", {
      userId: ownerId,
      title,
      roomType,
      style,
      beforeImageStorageId: args.beforeImageStorageId,
      prompt,
      budget,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    afterImageStorageId: v.optional(v.id("_storage")),
    title: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { ownerId } = await requireUser(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== ownerId) throw new Error("Project not found");
    if (args.afterImageStorageId === undefined && args.title === undefined) {
      throw new Error("At least one project field must be supplied");
    }

    const patch: {
      updatedAt: number;
      afterImageStorageId?: Id<"_storage">;
      title?: string;
    } = {
      updatedAt: Date.now(),
    };
    if (args.afterImageStorageId !== undefined) {
      await requireOwnedUpload(ctx, ownerId, args.afterImageStorageId);
      patch.afterImageStorageId = args.afterImageStorageId;
    }
    if (args.title !== undefined) {
      patch.title = boundedString(args.title, "title", 1, 120);
    }
    await ctx.db.patch("projects", args.projectId, patch);
    return null;
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { ownerId } = await requireUser(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.userId !== ownerId) throw new Error("Project not found");
    await ctx.db.delete("projects", args.projectId);
    return null;
  },
});
