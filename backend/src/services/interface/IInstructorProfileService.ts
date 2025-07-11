import { IInstructor } from "../../models/instructorModel";

export interface IInstructorProfileService {
  getProfile(email: string): Promise<IInstructor | null>;
  updateProfile(id: string, data: Partial<IInstructor>): Promise<IInstructor | null>;
  updatePassword(email: string, password: string): Promise<boolean>;
}
