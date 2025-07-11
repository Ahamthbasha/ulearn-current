import { IMembershipPlan } from "../../models/membershipPlanModel";

export interface IAdminMembershipService {
  createPlan(data: Partial<IMembershipPlan>): Promise<IMembershipPlan>;
  updatePlan(id: string, data: Partial<IMembershipPlan>): Promise<IMembershipPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  getPlanById(id: string): Promise<IMembershipPlan | null>;
  getAllPlans(): Promise<IMembershipPlan[]>;
  paginatePlans(filter: object, page: number, limit: number): Promise<{ data: IMembershipPlan[]; total: number }>;
  toggleStatus(id: string): Promise<IMembershipPlan | null>;
}
