import { Request, Response } from 'express';

export interface IStudentCourseReviewController {
  createReview(req: Request, res: Response): Promise<void>;
  updateReview(req: Request, res: Response): Promise<void>;
  deleteReview(req: Request, res: Response): Promise<void>;
  getMyReviews(req: Request, res: Response): Promise<void>;
  getMyReviewForCourse(req: Request, res: Response): Promise<void>;
}
