import { IMembershipPlan } from "../models/membershipPlanModel";

export function isMembershipPlan(plan: unknown): plan is IMembershipPlan {
  return (
    plan !== null &&
    typeof plan === "object" &&
    "_id" in plan &&
    typeof (plan as any)._id?.toString === "function"
  );
}