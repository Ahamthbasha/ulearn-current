import { IMembershipPlan } from "../../../models/membershipPlanModel";

export interface IAdminMembershipRepository {
  createPlan(planData: Partial<IMembershipPlan>): Promise<IMembershipPlan>;
  updatePlan(
    id: string,
    updateData: Partial<IMembershipPlan>
  ): Promise<IMembershipPlan | null>;
  deletePlan(id: string): Promise<boolean>;
  getPlanById(id: string): Promise<IMembershipPlan | null>;
  getAllPlans(): Promise<IMembershipPlan[]>;
  findOne(filter: object): Promise<IMembershipPlan | null>;

  paginatePlans(
    filter: object,
    page: number,
    limit: number,
    sort?: Record<string, any>
  ): Promise<{ data: IMembershipPlan[]; total: number }>;

  toggleStatus(id: string): Promise<IMembershipPlan | null>;
}
