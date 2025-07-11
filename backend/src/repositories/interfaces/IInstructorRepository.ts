import { IInstructor } from "../../models/instructorModel";
import {IGenericRepository } from "../genericRepository";

export default interface IInstructorRepository extends IGenericRepository<IInstructor>{
    findByEmail(email:string):Promise<IInstructor | null>
    createUser(userData:IInstructor):Promise<IInstructor | null>
    resetPassword(email:string,password:string):Promise<IInstructor | null>
    googleLogin(name:string,email:string):Promise<IInstructor | null>

    updateByEmail(email:string,data:Partial<IInstructor>):Promise<IInstructor | null>

    //enrollment side use
    findById(id: string): Promise<IInstructor | null>;
}