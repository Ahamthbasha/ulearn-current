import { Request, Response } from "express";

export interface IStudentLmsEnrollmentController {
  getEnrolledLearningPaths(req: Request, res: Response): Promise<void>;
  getLearningPathDetails(req: Request, res: Response): Promise<void>;
  completeCourseAndUnlockNext(req: Request, res: Response): Promise<void>;
  getLearningPathCertificate(req: Request, res: Response): Promise<void>;
}