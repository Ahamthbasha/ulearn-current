import { Request, Response } from "express";

export interface IStudentDashboardController {
  getDashboardData(req: Request, res: Response): Promise<void>;
  getCourseReport(req:Request,res:Response):Promise<void>;
  getSlotReport(req:Request,res:Response):Promise<void>;
  exportCourseReport(req:Request,res:Response):Promise<void>;
  exportSlotReport(req:Request,res:Response):Promise<void>
}