import { IInstructor } from "../../../models/instructorModel";
import { InstructorProfileDTO } from "../../../models/instructorModel";

export interface IInstructorProfileService {
  getProfile(email: string): Promise<InstructorProfileDTO | null>;
  updateProfile(
    id: string,
    data: Partial<IInstructor>,
  ): Promise<InstructorProfileDTO | null>;
  updatePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean>;
  updateBankAccount(
    id: string,
    bankAccount: {
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    },
  ): Promise<InstructorProfileDTO | null>;
  getInstructorRaw(email: string): Promise<IInstructor | null>;
}
