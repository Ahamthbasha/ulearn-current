import { IAdminService } from "../interface/IAdminService";
import { IAdmin } from "../../models/adminModel";
import { IAdminRepository } from "../../repositories/interfaces/IAdminRepository";
import { IInstructor } from "../../models/instructorModel";
import { IUser } from "../../models/userModel";
export class AdminService implements IAdminService{
    private adminRepository : IAdminRepository

    constructor(adminRepository : IAdminRepository){
        this.adminRepository = adminRepository
    }

    async getAdminData(email: string): Promise<IAdmin | null> {
        return await this.adminRepository.getAdmin(email)
    }

    async createAdmin(adminData: IAdmin): Promise<IAdmin | null> {
        return await this.adminRepository.createAdmin(adminData)
    }

    async getAllUsers(page:number,limit:number,search:string): Promise<{users:IUser[];total:number}> {
        return await this.adminRepository.getAllUsers(page,limit,search)
    }

    async getAllInstructors(page:number,limit:number,search:string): Promise<{instructors:IInstructor[];total:number}> {
        return await this.adminRepository.getAllInstructors(page,limit,search)
    }

//specified data based on email
    async getUserData(email: string): Promise<IUser | null> {
        return this.adminRepository.getUserData(email)
    }

    async getInstructorData(email: string): Promise<IInstructor | null> {
        return await this.adminRepository.getInstructorData(email)
    }

//block or unblock
    async updateProfile(email: string, data: any): Promise<any> {
        return await this.adminRepository.updateProfile(email,data)
    }

    async updateInstructorProfile(email: string, data: any): Promise<any> {
        return await this.adminRepository.updateInstructorProfile(email,data)
    }
}