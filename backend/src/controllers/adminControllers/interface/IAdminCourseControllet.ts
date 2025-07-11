import { Request, Response } from "express";

export interface IAdminCourseController {
  getAllCourses(req: Request, res: Response): Promise<void>;
  updateListingStatus(req: Request, res: Response): Promise<void>;
}
