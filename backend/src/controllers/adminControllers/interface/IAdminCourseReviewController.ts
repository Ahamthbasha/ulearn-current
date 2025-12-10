import { Request, Response } from "express";

export interface IAdminCourseReviewController {
  getAllReviews(req: Request, res: Response): Promise<void>;
  deleteReview(req: Request, res: Response): Promise<void>;
  rejectReview(req: Request, res: Response): Promise<void>;
  approveReview(req:Request,res:Response)  :Promise<void>;
  getReviewById(req: Request, res: Response): Promise<void>;
}