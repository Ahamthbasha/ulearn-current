import { IUser } from "../../models/userModel";

export interface IStudentProfileRepository{
    getByEmail(email:string):Promise<IUser|null>
    updateProfile(id:string,data:Partial<IUser>):Promise<IUser|null>
    updatePassword(email:string,hashedPassword:string):Promise<IUser|null>
}