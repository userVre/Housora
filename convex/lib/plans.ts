export const PLAN_CREDITS = {
  free: 5,
  standard: 100,
  pro: 190,
  growth: 1200,
  scale: 2250,
  unlimited: 5250,
} as const;

export type Plan = keyof typeof PLAN_CREDITS;
export type PaidPlan = Exclude<Plan, "free">;

export function isPaidPlan(value: string): value is PaidPlan {
  return value !== "free" && Object.hasOwn(PLAN_CREDITS, value);
}
