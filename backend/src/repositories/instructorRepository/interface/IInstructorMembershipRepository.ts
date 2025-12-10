import { IMembershipPlan } from "../../../models/membershipPlanModel";

export interface IInstructorMembershipRepository {
  getActivePlans(): Promise<IMembershipPlan[]>;
  findById(id: string): Promise<IMembershipPlan | null>;
}
