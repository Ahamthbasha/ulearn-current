import { IInstructorMembershipService } from "../interface/IInstructorMembershipService";
import { IInstructorMembershipRepository } from "../../repositories/interfaces/IInstructorMembershipRepository";
import { IMembershipPlan } from "../../models/membershipPlanModel";
import {IInstructor} from "../../models/instructorModel"
import IInstructorRepository from "src/repositories/interfaces/IInstructorRepository";

export class InstructorMembershipService implements IInstructorMembershipService {
    private  instructorMembershipRepo: IInstructorMembershipRepository
    private instructorRepo : IInstructorRepository
  constructor(instructorMembershipRepo: IInstructorMembershipRepository,instructorRepo:IInstructorRepository) {
    this.instructorMembershipRepo = instructorMembershipRepo
    this.instructorRepo = instructorRepo
  }

  async getAvailablePlans(): Promise<IMembershipPlan[]> {
    return await this.instructorMembershipRepo.getActivePlans();
  }

  async getInstructorById(instructorId: string): Promise<IInstructor | null> {
  return this.instructorRepo.findById(instructorId);
}

async getMembershipStatus(instructorId: string): Promise<{
  planId: string | null;
  expiryDate: Date | null;
  isMentor: boolean;
}> {
  const instructor = await this.instructorRepo.findById(instructorId);
  if (!instructor) throw new Error("Instructor not found");

  return {
    planId: instructor.membershipPlanId?.toString() ?? null,
    expiryDate: instructor.membershipExpiryDate ?? null,
    isMentor: instructor.isMentor,
  };
}

}
