import { IAdminMembershipRepository } from "./interface/IAdminMembershipRepository"; 
import {
  MembershipPlanModel,
  IMembershipPlan,
} from "../../models/membershipPlanModel";
import { GenericRepository } from "../genericRepository";

export class AdminMembershipRepository
  extends GenericRepository<IMembershipPlan>
  implements IAdminMembershipRepository
{
  constructor() {
    super(MembershipPlanModel);
  }

  async createPlan(
    planData: Partial<IMembershipPlan>
  ): Promise<IMembershipPlan> {
    return this.create(planData);
  }

  async updatePlan(
    id: string,
    updateData: Partial<IMembershipPlan>
  ): Promise<IMembershipPlan | null> {
    return this.update(id, updateData);
  }

  async deletePlan(id: string): Promise<boolean> {
    const deleted = await this.delete(id);
    return deleted !== null;
  }

  async getPlanById(id: string): Promise<IMembershipPlan | null> {
    return this.findById(id);
  }

  async getAllPlans(): Promise<IMembershipPlan[]> {
    const plans = await this.findAll({}, undefined, { createdAt: -1 });
    return plans || [];
  }

  async paginatePlans(
    filter: object,
    page: number,
    limit: number,
    sort: Record<string, any> = { createdAt: -1 }
  ): Promise<{ data: IMembershipPlan[]; total: number }> {
    return this.paginate(filter, page, limit, sort);
  }

  async toggleStatus(id: string): Promise<IMembershipPlan | null> {
    const plan = await this.findById(id);
    if (!plan) return null;

    return this.update(id, { isActive: !plan.isActive });
  }
}
