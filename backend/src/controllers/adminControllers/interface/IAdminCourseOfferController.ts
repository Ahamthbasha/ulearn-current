import { Request, Response } from "express";

export interface IAdminCourseOfferController {
  getOfferRequests(req: Request, res: Response): Promise<void>;
  verifyCourseOffer(req: Request, res: Response): Promise<void>;
  getOfferById(req: Request, res: Response): Promise<void>;
}
