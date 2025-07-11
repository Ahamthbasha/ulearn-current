import { IAdminMembershipService } from "../interface/IAdminMembershipService";
import { IAdminMembershipRepository } from "../../repositories/interfaces/IAdminMembershipRepository";
import { IMembershipPlan } from "../../models/membershipPlanModel";

export class AdminMembershipService implements IAdminMembershipService {
  private membershipRepository: IAdminMembershipRepository;

  constructor(membershipRepository: IAdminMembershipRepository) {
    this.membershipRepository = membershipRepository;
  }

  async createPlan(data: Partial<IMembershipPlan>): Promise<IMembershipPlan> {
    const existing = await this.membershipRepository.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    });

    if (existing) {
      throw new Error("Membership plan with this name already exists.");
    }

    return this.membershipRepository.createPlan(data);
  }

  async updatePlan(id: string, data: Partial<IMembershipPlan>): Promise<IMembershipPlan | null> {
    if (data.name) {
      const existing = await this.membershipRepository.findOne({
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
      });

      if (existing?._id?.toString() !== id) {
        throw new Error("Another membership plan with this name already exists.");
      }
    }

    return this.membershipRepository.updatePlan(id, data);
  }

  async deletePlan(id: string): Promise<boolean> {
    return this.membershipRepository.deletePlan(id);
  }

  async getPlanById(id: string): Promise<IMembershipPlan | null> {
    return this.membershipRepository.getPlanById(id);
  }

  async getAllPlans(): Promise<IMembershipPlan[]> {
    return this.membershipRepository.getAllPlans();
  }

  async paginatePlans(filter: object, page: number, limit: number): Promise<{ data: IMembershipPlan[]; total: number }> {
    return this.membershipRepository.paginatePlans(filter, page, limit);
  }

  async toggleStatus(id: string): Promise<IMembershipPlan | null> {
    return this.membershipRepository.toggleStatus(id);
  }
}
