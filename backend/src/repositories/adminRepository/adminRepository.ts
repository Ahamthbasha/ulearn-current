import { IAdminRepository } from "./interface/IAdminRepository";
import AdminModel, { IAdmin } from "../../models/adminModel";
import { GenericRepository } from "../genericRepository";
import { IUser } from "../../models/userModel";
import { IInstructor } from "../../models/instructorModel";
import { IAdminUserRepository } from "./interface/IAdminUserRepository";
import { IAdminInstructorRepository } from "./interface/IAdminInstructorRepository";

export class AdminRespository
  extends GenericRepository<IAdmin>
  implements IAdminRepository
{
  private _adminUserRepository: IAdminUserRepository;
  private _adminInstructorRepository: IAdminInstructorRepository;
  constructor(
    adminUserRepository: IAdminUserRepository,
    adminInstructorRepository: IAdminInstructorRepository,
  ) {
    super(AdminModel);
    this._adminUserRepository = adminUserRepository;
    this._adminInstructorRepository = adminInstructorRepository;
  }

  async getAdmin(email: string): Promise<IAdmin | null> {
    return await this.findOne({ email });
  }

  async createAdmin(adminData: IAdmin): Promise<IAdmin | null> {
    return await this.create(adminData);
  }

  async getAllUsers(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ users: IUser[]; total: number }> {
    try {
      const users = await this._adminUserRepository.getAllUsers(
        page,
        limit,
        search,
      );
      return users;
    } catch (error) {
      throw error;
    }
  }

  async getAllInstructors(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ instructors: IInstructor[]; total: number }> {
    try {
      const instructors =
        await this._adminInstructorRepository.getAllInstructors(
          page,
          limit,
          search,
        );
      return instructors;
    } catch (error) {
      throw error;
    }
  }

  async getUserData(email: string) {
    try {
      const response = await this._adminUserRepository.getUserData(email);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getInstructorData(email: string) {
    try {
      const response =
        await this._adminInstructorRepository.getInstructorData(email);

      return response;
    } catch (error) {
      throw error;
    }
  }

  //block or unblock

  async updateProfile(email: string, data: any): Promise<any> {
    try {
      const response = await this._adminUserRepository.updateProfile(
        email,
        data,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateInstructorProfile(email: string, data: any): Promise<any> {
    try {
      const response =
        await this._adminInstructorRepository.updateInstructorProfile(
          email,
          data,
        );
      return response;
    } catch (error) {
      throw error;
    }
  }
}
