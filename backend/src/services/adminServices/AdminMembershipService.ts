import { IAdminMembershipService } from "./interface/IAdminMembershipService"; 
import { IAdminMembershipRepository } from "../../repositories/adminRepository/interface/IAdminMembershipRepository"; 
import { IMembershipPlan } from "../../models/membershipPlanModel";

export class AdminMembershipService implements IAdminMembershipService {
  private _membershipRepository: IAdminMembershipRepository;

  constructor(membershipRepository: IAdminMembershipRepository) {
    this._membershipRepository = membershipRepository;
  }

  async createPlan(data: Partial<IMembershipPlan>): Promise<IMembershipPlan> {
    const existing = await this._membershipRepository.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    });

    if (existing) {
      throw new Error("Membership plan with this name already exists.");
    }

    return this._membershipRepository.createPlan(data);
  }

  async updatePlan(id: string, data: Partial<IMembershipPlan>): Promise<IMembershipPlan | null> {
  if (data.name) {
    const existing = await this._membershipRepository.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    }) as IMembershipPlan | null;

    if (existing && existing._id.toString() !== id) {
      throw new Error("Another membership plan with this name already exists.");
    }
  }

  return this._membershipRepository.updatePlan(id, data);
}




  async deletePlan(id: string): Promise<boolean> {
    return this._membershipRepository.deletePlan(id);
  }

  async getPlanById(id: string): Promise<IMembershipPlan | null> {
    return this._membershipRepository.getPlanById(id);
  }

  async getAllPlans(): Promise<IMembershipPlan[]> {
    return this._membershipRepository.getAllPlans();
  }

  async paginatePlans(filter: object, page: number, limit: number): Promise<{ data: IMembershipPlan[]; total: number }> {
    return this._membershipRepository.paginatePlans(filter, page, limit);
  }

  async toggleStatus(id: string): Promise<IMembershipPlan | null> {
    return this._membershipRepository.toggleStatus(id);
  }
}
