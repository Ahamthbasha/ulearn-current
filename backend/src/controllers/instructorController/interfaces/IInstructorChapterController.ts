import { Request, Response, NextFunction } from "express";

export interface IInstructorChapterController {
  createChapter(req: Request, res: Response, next: NextFunction): Promise<void>;
  getChaptersByCourse(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateChapter(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteChapter(req: Request, res: Response, next: NextFunction): Promise<void>;
  getChapterById(req: Request, res: Response, next: NextFunction): Promise<void>;
}
