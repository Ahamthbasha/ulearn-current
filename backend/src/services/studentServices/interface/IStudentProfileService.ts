import { IUser } from "../../../models/userModel";
import { StudentProfileDTO } from "../../../dto/userDTO/studentProfileDTO"; 

export interface IStudentProfileService {
  getProfile(email: string): Promise<StudentProfileDTO | null>;
  updateProfile(id: string, data: Partial<IUser>): Promise<StudentProfileDTO | null>;
  updatePassword(email: string, password: string): Promise<boolean>;
  getUserByEmail(email: string): Promise<IUser | null>; // raw user (for password validation only)
}
