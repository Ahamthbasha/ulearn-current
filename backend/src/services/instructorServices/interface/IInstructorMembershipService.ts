import { IInstructor } from "../../../models/instructorModel";
import { IMembershipPlan } from "../../../models/membershipPlanModel";

export interface IInstructorMembershipService {
  getAvailablePlans(): Promise<IMembershipPlan[]>;
  getInstructorById(instructorId: string): Promise<IInstructor | null>;
  getMembershipStatus(instructorId: string): Promise<{
  planId: string | null;
  expiryDate: Date | null;
  isMentor: boolean;
}>;

}
