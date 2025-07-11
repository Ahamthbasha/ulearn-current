import { Request, Response, NextFunction } from "express";

export interface IInstructorQuizController {
  createQuiz(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteQuiz(req: Request, res: Response, next: NextFunction): Promise<void>;
  getQuizById(req: Request, res: Response, next: NextFunction): Promise<void>;
  getQuizByCourseId(req: Request, res: Response, next: NextFunction): Promise<void>;

  addQuestion(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void>;

  getPaginatedQuestionsByCourseId(req: Request, res: Response, next: NextFunction): Promise<void>;



}
