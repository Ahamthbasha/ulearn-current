import { Request, Response } from "express";

export interface IInstructorCourseOfferController {
  createCourseOffer(req: Request, res: Response): Promise<void>;
  editCourseOffer(req: Request, res: Response): Promise<void>;
  resubmitOffer(req: Request, res: Response): Promise<void>;
  getOffersByInstructor(req: Request, res: Response): Promise<void>;
  getOfferById(req: Request, res: Response): Promise<void>;
  deleteOffer(req: Request, res: Response): Promise<void>;
}
