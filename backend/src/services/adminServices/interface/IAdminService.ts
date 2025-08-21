import { IUser } from "../../../models/userModel";
import { IAdmin, IAdminDTO } from "../../../models/adminModel";
import { IInstructor } from "../../../models/instructorModel";
import { UserListDTO } from "../../../dto/adminDTO/userListDTO";
import { InstructorDTO } from "../../../dto/adminDTO/instructorListDTO";
import { BlockUpdate } from "../../../types/adminTypes/adminTypes";

export interface IAdminService {
  getAdminData(email: string): Promise<IAdmin | null>;
  createAdmin(adminData: IAdminDTO): Promise<IAdmin | null>;

  getAllUsers(
    page: number,
    limit: number,
    search: string
  ): Promise<{ users: UserListDTO[]; total: number }>;
  getAllInstructors(
    page: number,
    limit: number,
    search: string
  ): Promise<{ instructors: InstructorDTO[]; total: number }>;

  //specified data based on email
  getUserData(email: string): Promise<IUser | null>;
  getInstructorData(email: string): Promise<IInstructor | null>;

  //block or unblock
  updateProfile(email: string, data: BlockUpdate): Promise<IUser|null>;
  updateInstructorProfile(email: string, data: BlockUpdate): Promise<IInstructor|null>;
}
