import { IInstructor } from "../../models/instructorModel";

export default interface IInstructorService{
    findByEmail(email:string):Promise<IInstructor | null>
    createUser(userData:IInstructor):Promise<IInstructor | null>
    resetPassword(email:string,password:string):Promise<IInstructor | null>
    googleLogin(name:string,email:string):Promise<IInstructor | null>

    setInstructorVerified(email:string):Promise<IInstructor | null>
}