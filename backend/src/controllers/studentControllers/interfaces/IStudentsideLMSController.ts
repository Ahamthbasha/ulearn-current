import { Request, Response, NextFunction } from "express";

export interface IStudentLearningPathController {
  createLearningPath(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  updateLearningPath(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  deleteLearningPath(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  getLearningPathById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  getStudentLearningPaths(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
}