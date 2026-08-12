import type { UserIdentity } from "convex/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthContext = QueryCtx | MutationCtx;

export async function requireIdentity(ctx: AuthContext): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized: authentication required");
  return identity;
}

export async function findUserForIdentity(
  ctx: AuthContext,
  identity: UserIdentity,
): Promise<Doc<"users"> | null> {
  const byAuthId = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
    .unique();
  if (byAuthId) return byAuthId;

  // Migration fallback for rows created before authId was persisted.
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function requireUser(ctx: AuthContext): Promise<{
  identity: UserIdentity;
  user: Doc<"users">;
  ownerId: string;
}> {
  const identity = await requireIdentity(ctx);
  const user = await findUserForIdentity(ctx, identity);
  if (!user) throw new Error("User not found");
  if (user.deletionRequestedAt !== undefined) {
    throw new Error("Account deletion is in progress");
  }
  return { identity, user, ownerId: user.clerkId ?? identity.subject };
}

/** Compatibility check for current browser calls; authorization never uses this value. */
export function assertOwnClerkId(identity: UserIdentity, clerkId: string): void {
  if (clerkId !== identity.subject) {
    throw new Error("Unauthorized: user identifier does not match the session");
  }
}
