import { IInstructorMembershipService } from "./interface/IInstructorMembershipService"; 
import { IInstructorMembershipRepository } from "../../repositories/instructorRepository/interface/IInstructorMembershipRepository"; 
import { IMembershipPlan } from "../../models/membershipPlanModel";
import { IInstructor } from "../../models/instructorModel";
import IInstructorRepository from "../../repositories/instructorRepository/interface/IInstructorRepository"; 

export class InstructorMembershipService
  implements IInstructorMembershipService
{
  private _instructorMembershipRepo: IInstructorMembershipRepository;
  private _instructorRepo: IInstructorRepository;
  constructor(
    instructorMembershipRepo: IInstructorMembershipRepository,
    instructorRepo: IInstructorRepository
  ) {
    this._instructorMembershipRepo = instructorMembershipRepo;
    this._instructorRepo = instructorRepo;
  }

  async getAvailablePlans(): Promise<IMembershipPlan[]> {
    return await this._instructorMembershipRepo.getActivePlans();
  }

  async getInstructorById(instructorId: string): Promise<IInstructor | null> {
    return this._instructorRepo.findById(instructorId);
  }

  async getMembershipStatus(instructorId: string): Promise<{
    planId: string | null;
    expiryDate: Date | null;
    isMentor: boolean;
  }> {
    const instructor = await this._instructorRepo.findById(instructorId);
    if (!instructor) throw new Error("Instructor not found");
    return {
      planId: instructor.membershipPlanId?.toString() ?? null,
      expiryDate: instructor.membershipExpiryDate ?? null,
      isMentor: instructor.isMentor,
    };
  }
}
