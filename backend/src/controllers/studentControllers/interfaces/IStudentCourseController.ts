import { Request, Response } from "express";

export interface IStudentCourseController {
  getAllCourses(req: Request, res: Response): Promise<void>;
  getFilteredCourses(req: Request, res: Response): Promise<void>;
  getCourseDetails(req: Request, res: Response): Promise<void>;
}
