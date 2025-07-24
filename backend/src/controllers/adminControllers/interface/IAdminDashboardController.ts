import { Request, Response } from "express";

export interface IAdminDashboardController {
  getDashboardData(req: Request, res: Response): Promise<void>;
  getCourseSalesReport(req: Request, res: Response): Promise<void>;
  getMembershipSalesReport(req: Request, res: Response): Promise<void>;
  exportCourseSalesReport(req: Request, res: Response): Promise<void>
  exportMembershipSalesReport(req: Request, res: Response): Promise<void>;
}
