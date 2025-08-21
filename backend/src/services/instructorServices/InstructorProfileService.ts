import { IInstructorProfileService } from "./interface/IInstructorProfileService";
import { IInstructorProfileRepository } from "../../repositories/instructorRepository/interface/IInstructorProfileRepository";
import { IInstructor } from "../../models/instructorModel";
import { InstructorProfileDTO } from "../../models/instructorModel";
import { toInstructorProfileDTO } from "../../mappers/instructorMapper/instructorProfileMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

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

    // Handle profile picture URL if exists
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

    // Handle profile picture URL for updated instructor
    const profilePicUrl = updatedInstructor.profilePicUrl
      ? await getPresignedUrl(updatedInstructor.profilePicUrl)
      : undefined;

    return toInstructorProfileDTO(updatedInstructor, profilePicUrl);
  }

  async updatePassword(email: string, password: string): Promise<boolean> {
    const updated = await this._instructorProfileRepo.updatePassword(
      email,
      password,
    );
    return !!updated;
  }

  // Additional method to get raw instructor data if needed internally
  async getInstructorRaw(email: string): Promise<IInstructor | null> {
    return await this._instructorProfileRepo.getByEmail(email);
  }
}
