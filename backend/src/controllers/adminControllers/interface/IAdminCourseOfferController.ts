import { Request, Response } from "express";

export interface IAdminCourseOfferController {
  getPublishedCourses(req: Request, res: Response): Promise<void>;
  createCourseOffer(req: Request, res: Response): Promise<void>;
  editCourseOffer(req: Request, res: Response): Promise<void>;
  toggleCourseOfferActive(req: Request, res: Response): Promise<void>;
  deleteCourseOffer(req: Request, res: Response): Promise<void>;
  getCourseOffers(req: Request, res: Response): Promise<void>;
  getCourseOfferById(req: Request, res: Response): Promise<void>
}