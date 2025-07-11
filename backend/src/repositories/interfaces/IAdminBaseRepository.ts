import { IUser } from "../../models/userModel";
import { IInstructor } from "../../models/instructorModel";

export interface IAdminBaseRepository{

//get all data
    getAllUsers(page: number, limit: number, search: string):Promise<{users:IUser[];total:number}>
    getAllInstructors(page: number, limit: number, search: string):Promise<{instructors:IInstructor[];total:number}>

//get data based on email
    getUserData(email:string):Promise<IUser | null>
    getInstructorData(email:string):Promise<IInstructor | null>

//block and unblock
    updateProfile(email:string,data:any):Promise<any>
    updateInstructorProfile(email:string,data:any):Promise<any>
}