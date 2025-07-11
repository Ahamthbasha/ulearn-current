
import { IUser } from "../../models/userModel";

export default interface IStudentService {
    findByEmail(email: string):Promise<IUser | null>;
    createUser(userData:IUser):Promise<IUser | null>
    resetPassword(email:string,password:string):Promise<IUser | null>
    googleLogin(name:string,email:string):Promise<IUser | null>

}