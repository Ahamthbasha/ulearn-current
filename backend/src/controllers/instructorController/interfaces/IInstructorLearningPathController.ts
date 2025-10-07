import { Request, Response, NextFunction } from "express";

export interface IInstructorLearningPathController {
  createLearningPath(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateLearningPath(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteLearningPath(req: Request, res: Response, next: NextFunction): Promise<void>;
  getLearningPathById(req: Request, res: Response, next: NextFunction): Promise<void>;
  getInstructorLearningPaths(req: Request, res: Response, next: NextFunction): Promise<void>;
  publishLearningPath(req: Request, res: Response, next: NextFunction): Promise<void>;
  submitLearningPathToAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
  resubmitLearningPathToAdmin(req: Request, res: Response, next: NextFunction): Promise<void>; // New method
}