import { Request,Response,NextFunction } from "express";

export interface IInstructorCategoryController {
    getListedCategories(req:Request,res:Response,next:NextFunction):Promise<void>
}