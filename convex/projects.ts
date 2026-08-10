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
export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const clerkId = await getVerifiedUserId(ctx);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", clerkId))
      .order("desc")
      .collect();
  },
});

export const createProject = mutation({
  args: {
    title: v.string(),
    roomType: v.string(),
    style: v.string(),
    beforeImageUrl: v.optional(v.string()),
    prompt: v.optional(v.string()),
    budget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getVerifiedUserId(ctx);

    return await ctx.db.insert("projects", {
      userId,
      title: args.title,
      roomType: args.roomType,
      style: args.style,
      beforeImageUrl: args.beforeImageUrl,
      prompt: args.prompt,
      budget: args.budget,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    afterImageUrl: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Verify the authenticated user owns this project
    const verifiedId = await getVerifiedUserId(ctx);
    if (project.userId !== verifiedId) {
      throw new Error("Unauthorized: you can only update your own projects");
    }

    const patchData: { updatedAt: number; afterImageUrl?: string; title?: string } = { updatedAt: Date.now() };
    if (args.afterImageUrl !== undefined) patchData.afterImageUrl = args.afterImageUrl;
    if (args.title !== undefined) patchData.title = args.title;
    await ctx.db.patch(args.projectId, patchData);
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Verify the authenticated user owns this project
    const verifiedId = await getVerifiedUserId(ctx);
    if (project.userId !== verifiedId) {
      throw new Error("Unauthorized: you can only delete your own projects");
    }

    await ctx.db.delete(args.projectId);
  },
});
