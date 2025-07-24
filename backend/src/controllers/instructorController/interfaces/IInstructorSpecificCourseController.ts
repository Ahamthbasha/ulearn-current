import { Request, Response } from "express";

export interface IInstructorCourseSpecificDashboardController {
  getCourseDashboard(req: Request, res: Response): Promise<void>;
  getCourseRevenueReport(req: Request, res: Response): Promise<void>;
  exportCourseRevenueReport(req: Request, res: Response): Promise<void>; 
}