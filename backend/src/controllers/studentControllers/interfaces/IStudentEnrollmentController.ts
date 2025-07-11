import { Request, Response } from "express";

export interface IStudentEnrollmentController {
  getAllEnrolledCourses(req: Request, res: Response): Promise<void>;
  getEnrollmentCourseDetails(req: Request, res: Response): Promise<void>;
  completeChapter(req: Request, res: Response): Promise<void>;
  submitQuizResult(req: Request, res: Response): Promise<void>;
  checkAllChaptersCompleted(req: Request, res: Response): Promise<void>;
  getCertificateUrl(req: Request, res: Response): Promise<void>;
}
