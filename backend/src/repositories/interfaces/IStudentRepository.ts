import {IUser} from "../../models/userModel"
import { IGenericRepository } from "../genericRepository"

import {Types} from "mongoose"
export interface IStudentRepository extends IGenericRepository<IUser>{
    findByEmail(email:string) : Promise<IUser | null>
    createUser(userData:IUser): Promise<IUser | null>
    resetPasswrod(email:string,password:string):Promise<IUser | null>
    googleLogin(name:string,email:string):Promise<IUser | null> 
    findById(userId:string | Types.ObjectId):Promise<IUser | null>

}