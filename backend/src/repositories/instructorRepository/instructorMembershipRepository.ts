import { IInstructorMembershipRepository } from "../interfaces/IInstructorMembershipRepository";
import {
  IMembershipPlan,
  MembershipPlanModel,
} from "../../models/membershipPlanModel";
import { GenericRepository } from "../genericRepository";

export class InstructorMembershipRepository
  extends GenericRepository<IMembershipPlan>
  implements IInstructorMembershipRepository
{
  constructor() {
    super(MembershipPlanModel);
  }
  async getActivePlans() {
    return await this.findAll({ isActive: true });
  }

  async findById(id: string): Promise<IMembershipPlan | null> {
    return await super.findById(id);
  }
}
