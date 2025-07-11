import { IUser } from "../../models/userModel";

export interface IStudentProfileService {
  getProfile(email: string): Promise<IUser | null>;
  updateProfile(id: string, data: Partial<IUser>): Promise<IUser | null>;
  updatePassword(email: string, password:string): Promise<boolean>;
}
