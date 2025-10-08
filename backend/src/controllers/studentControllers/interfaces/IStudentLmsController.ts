import { Request, Response } from "express";

export interface IStudentLmsController {
  getLearningPaths(req: Request, res: Response): Promise<void>;
  getLearningPathById(req: Request, res: Response): Promise<void>;
}