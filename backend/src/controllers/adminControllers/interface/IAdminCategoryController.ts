import {Request,Response} from 'express'

export interface IAdminCategoryController{
    addCategory(req:Request,res:Response):Promise<void>
    editCategory(req:Request,res:Response):Promise<void>
    listOrUnlistCategory(req:Request,res:Response):Promise<void>
    findCategoryById(req:Request,res:Response):Promise<void>
    getAllCategory(req:Request,res:Response):Promise<void>
}