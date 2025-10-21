import { IInstructorProfileService } from "./interface/IInstructorProfileService";
import { IInstructorProfileRepository } from "../../repositories/instructorRepository/interface/IInstructorProfileRepository";
import { IInstructor } from "../../models/instructorModel";
import { InstructorProfileDTO } from "../../models/instructorModel";
import { toInstructorProfileDTO } from "../../mappers/instructorMapper/instructorProfileMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import bcrypt from "bcrypt";

export class InstructorProfileService implements IInstructorProfileService {
  private _instructorProfileRepo: IInstructorProfileRepository;

  constructor(instructorProfileRepo: IInstructorProfileRepository) {
    this._instructorProfileRepo = instructorProfileRepo;
  }

  async getProfile(email: string): Promise<InstructorProfileDTO | null> {
    const instructor = await this._instructorProfileRepo.getByEmail(email);

    if (!instructor) {
      return null;
    }

    const profilePicUrl = instructor.profilePicUrl
      ? await getPresignedUrl(instructor.profilePicUrl)
      : undefined;

    return toInstructorProfileDTO(instructor, profilePicUrl);
  }

  async updateProfile(
    id: string,
    data: Partial<IInstructor>,
  ): Promise<InstructorProfileDTO | null> {
    const updatedInstructor = await this._instructorProfileRepo.updateProfile(
      id,
      data,
    );

    if (!updatedInstructor) {
      return null;
    }

    const profilePicUrl = updatedInstructor.profilePicUrl
      ? await getPresignedUrl(updatedInstructor.profilePicUrl)
      : undefined;

    return toInstructorProfileDTO(updatedInstructor, profilePicUrl);
  }

  async updatePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const instructor = await this._instructorProfileRepo.getByEmail(email);

    if (!instructor) {
      return false;
    }

    const isMatch = await bcrypt.compare(currentPassword, instructor.password);

    if (!isMatch) {
      return false;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await this._instructorProfileRepo.updatePassword(
      email,
      hashed,
    );

    return !!updated;
  }

  async updateBankAccount(
    id: string,
    bankAccount: {
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    },
  ): Promise<InstructorProfileDTO | null> {
    const bankAccountData: Partial<IInstructor> = {
      bankAccount: {
        ...(bankAccount.accountHolderName && {
          accountHolderName: bankAccount.accountHolderName,
        }),
        ...(bankAccount.accountNumber && {
          accountNumber: await bcrypt.hash(bankAccount.accountNumber, 10),
        }),
        ...(bankAccount.ifscCode && {
          ifscCode: await bcrypt.hash(bankAccount.ifscCode, 10),
        }),
        ...(bankAccount.bankName && { bankName: bankAccount.bankName }),
      },
    };

    const updatedInstructor = await this._instructorProfileRepo.updateProfile(
      id,
      bankAccountData,
    );

    if (!updatedInstructor) {
      return null;
    }

    const profilePicUrl = updatedInstructor.profilePicUrl
      ? await getPresignedUrl(updatedInstructor.profilePicUrl)
      : undefined;

    return toInstructorProfileDTO(updatedInstructor, profilePicUrl);
  }

  async getInstructorRaw(email: string): Promise<IInstructor | null> {
    return await this._instructorProfileRepo.getByEmail(email);
  }
}