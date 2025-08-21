import { IStudentProfileService } from "./interface/IStudentProfileService";
import { IStudentProfileRepository } from "../../repositories/studentRepository/interface/IStudentProfileRepository";
import { IUser } from "../../models/userModel";
import { toStudentProfileDTO } from "../../mappers/userMapper/studentProfileMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { StudentProfileDTO } from "../../dto/userDTO/studentProfileDTO";

export class StudentProfileService implements IStudentProfileService {
  private _studentProfileRepository: IStudentProfileRepository;

  constructor(studentProfileRepository: IStudentProfileRepository) {
    this._studentProfileRepository = studentProfileRepository;
  }

  async getProfile(email: string): Promise<StudentProfileDTO | null> {
    const user = await this._studentProfileRepository.getByEmail(email);
    if (!user) return null;

    const profilePicUrl = user.profilePicUrl
      ? await getPresignedUrl(user.profilePicUrl)
      : undefined;

    return toStudentProfileDTO(user, profilePicUrl);
  }

  async updateProfile(
    id: string,
    data: Partial<IUser>,
  ): Promise<StudentProfileDTO | null> {
    const updatedUser = await this._studentProfileRepository.updateProfile(
      id,
      data,
    );
    if (!updatedUser) return null;

    const profilePicUrl = updatedUser.profilePicUrl
      ? await getPresignedUrl(updatedUser.profilePicUrl)
      : undefined;

    return toStudentProfileDTO(updatedUser, profilePicUrl);
  }

  async updatePassword(email: string, password: string): Promise<boolean> {
    const updated = await this._studentProfileRepository.updatePassword(
      email,
      password,
    );
    return !!updated;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await this._studentProfileRepository.getByEmail(email);
  }
}
