/**
 * The single source of truth for paid-product entitlements. Keep this in sync
 * with Whop products and the pricing page; backend checks use these values.
 */
export const PLAN_ENTITLEMENTS = {
  free: { generationsPerMonth: 3, maxSavedProjects: 3, variationsPerGeneration: 1 },
  standard: { generationsPerMonth: 100, maxSavedProjects: 10, variationsPerGeneration: 1 },
  pro: { generationsPerMonth: 190, maxSavedProjects: 30, variationsPerGeneration: 4 },
  // "growth" is the existing internal identifier for the Enterprise product.
  growth: { generationsPerMonth: 1_500, maxSavedProjects: null, variationsPerGeneration: 4 },
  // Legacy paid tiers are retained for existing subscribers.
  scale: { generationsPerMonth: 2_250, maxSavedProjects: null, variationsPerGeneration: 4 },
  unlimited: { generationsPerMonth: 5_250, maxSavedProjects: null, variationsPerGeneration: 4 },
} as const;

export const PLAN_CREDITS = {
  free: PLAN_ENTITLEMENTS.free.generationsPerMonth,
  standard: PLAN_ENTITLEMENTS.standard.generationsPerMonth,
  pro: PLAN_ENTITLEMENTS.pro.generationsPerMonth,
  growth: PLAN_ENTITLEMENTS.growth.generationsPerMonth,
  scale: PLAN_ENTITLEMENTS.scale.generationsPerMonth,
  unlimited: PLAN_ENTITLEMENTS.unlimited.generationsPerMonth,
} as const;

export type Plan = keyof typeof PLAN_CREDITS;
export type PaidPlan = Exclude<Plan, "free">;

export function isPaidPlan(value: string): value is PaidPlan {
  return value !== "free" && Object.hasOwn(PLAN_CREDITS, value);
}

export function getPlanEntitlement(plan: string | undefined) {
  return PLAN_ENTITLEMENTS[plan as Plan] ?? PLAN_ENTITLEMENTS.free;
}
