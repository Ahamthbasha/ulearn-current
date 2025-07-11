import { IAdminRepository } from "../interfaces/IAdminRepository";
import { IAdminBaseRepository } from "../interfaces/IAdminBaseRepository";
import AdminModel, { IAdmin } from "../../models/adminModel";
import { GenericRepository } from "../genericRepository";
import { IUser } from "../../models/userModel";
import { IInstructor } from "../../models/instructorModel";

export class AdminRespository extends GenericRepository<IAdmin> implements IAdminRepository{
    private adminBaseRepository : IAdminBaseRepository
    constructor(adminBaseRepositor:IAdminBaseRepository){
        super(AdminModel)
        this.adminBaseRepository = adminBaseRepositor
    }

    async getAdmin(email: string): Promise<IAdmin | null> {
        return await this.findOne({email})
    }

    async createAdmin(adminData: IAdmin): Promise<IAdmin | null> {
        return await this.create(adminData)
    }

    async getAllUsers(page: number, limit: number, search: string):Promise<{users:IUser[];total:number}>{
        try {
            const users = await this.adminBaseRepository.getAllUsers(page, limit, search)
            return users
        } catch (error) {
            throw error
        }
    }

    async getAllInstructors(page: number, limit: number, search: string):Promise<{instructors:IInstructor[];total:number}>{
        try {
            const instructors = await this.adminBaseRepository.getAllInstructors(page, limit, search)
            return instructors
        } catch (error) {
            throw error
        }
    }

    async getUserData(email:string){
        try {
            const response = await this.adminBaseRepository.getUserData(email)

            return response
        } catch (error) {
            throw error
        }
    }

    async getInstructorData(email:string){
        try {
            const response = await this.adminBaseRepository.getInstructorData(email)

            return response
        } catch (error) {
            throw error
        }
    }

//block or unblock

    async updateProfile(email: string, data: any): Promise<any> {
        try {
            const response = await this.adminBaseRepository.updateProfile(email,data)
            return response
        } catch (error) {
            throw error
        }
    }

    async updateInstructorProfile(email: string, data: any): Promise<any> {
        try {
            const response = await this.adminBaseRepository.updateInstructorProfile(email,data)
            return response
        } catch (error) {
            throw error
        }
    }
}