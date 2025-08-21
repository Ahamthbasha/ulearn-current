import { IInstructor } from "../../../models/instructorModel";
import { InstructorProfileDTO } from "../../../models/instructorModel";

export interface IInstructorProfileService {
  getProfile(email: string): Promise<InstructorProfileDTO | null>;
  updateProfile(
    id: string,
    data: Partial<IInstructor>,
  ): Promise<InstructorProfileDTO | null>;
  updatePassword(email: string, password: string): Promise<boolean>;
  getInstructorRaw(email: string): Promise<IInstructor | null>;
}
