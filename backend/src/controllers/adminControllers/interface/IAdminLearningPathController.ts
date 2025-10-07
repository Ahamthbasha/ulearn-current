import { Request, Response, NextFunction } from "express";

export interface IAdminLearningPathController {
  getSubmittedLearningPaths(req: Request, res: Response, next: NextFunction): Promise<void>;
  getLearningPathById(req: Request, res: Response, next: NextFunction): Promise<void>;
  verifyLearningPath(req: Request, res: Response, next: NextFunction): Promise<void>;
}