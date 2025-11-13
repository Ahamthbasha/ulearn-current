import { Request, Response } from "express";;

export interface IInstructorCourseReviewController {
  getReviews(req: Request, res: Response): Promise<void>;
  flagReview(req: Request, res: Response): Promise<void>;
}