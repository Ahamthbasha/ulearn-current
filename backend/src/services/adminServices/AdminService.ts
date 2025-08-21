import { IAdminService } from "./interface/IAdminService";
import { IAdmin } from "../../models/adminModel";
import { IAdminRepository } from "../../repositories/adminRepository/interface/IAdminRepository";
import { IInstructor } from "../../models/instructorModel";
import { IUser } from "../../models/userModel";
import { toUserListDTOs } from "../../mappers/adminMapper/userListMapper";
import { mapInstructorsToDTO } from "../../mappers/adminMapper/instructorListMapper";
import { UserListDTO } from "../../dto/adminDTO/userListDTO";
import { InstructorDTO } from "../../dto/adminDTO/instructorListDTO";
import { BlockUpdate } from "../../types/adminTypes/adminTypes";

export class AdminService implements IAdminService {
  private _adminRepository: IAdminRepository;

  constructor(adminRepository: IAdminRepository) {
    this._adminRepository = adminRepository;
  }

  async getAdminData(email: string): Promise<IAdmin | null> {
    return await this._adminRepository.getAdmin(email);
  }

  async createAdmin(adminData: IAdmin): Promise<IAdmin | null> {
    return await this._adminRepository.createAdmin(adminData);
  }

  async getAllUsers(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ users: UserListDTO[]; total: number }> {
    const { users, total } = await this._adminRepository.getAllUsers(
      page,
      limit,
      search,
    );
    const userDTOs = toUserListDTOs(users); // ✅ mapping in service
    return { users: userDTOs, total };
  }

  async getAllInstructors(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ instructors: InstructorDTO[]; total: number }> {
    const { instructors, total } =
      await this._adminRepository.getAllInstructors(page, limit, search);
    const instructorDTOs = mapInstructorsToDTO(instructors); // ✅ mapping in service
    return { instructors: instructorDTOs, total };
  }

  async getUserData(email: string): Promise<IUser | null> {
    return this._adminRepository.getUserData(email);
  }

  async getInstructorData(email: string): Promise<IInstructor | null> {
    return await this._adminRepository.getInstructorData(email);
  }

  async updateProfile(email: string, data: BlockUpdate): Promise<IUser | null> {
    return await this._adminRepository.updateProfile(email, data);
  }

  async updateInstructorProfile(
    email: string,
    data: BlockUpdate,
  ): Promise<IInstructor | null> {
    return await this._adminRepository.updateInstructorProfile(email, data);
  }
}
