import { Request,Response } from "express";

export interface IAdminController{
    login(req:Request,res:Response):Promise<void>
    logout(req:Request,res:Response):Promise<void>
    getAllUsers(req:Request,res:Response):Promise<void>
    getAllInstructors(req:Request,res:Response):Promise<void>

    blockUser(req:Request,res:Response):Promise<void>
    blockInstructor(req:Request,res:Response):Promise<void>
}