import { Request, Response } from "express";

export interface IInstructorMembershipController {
  getPlans(req: Request, res: Response): Promise<void>;
  getStatus(req: Request, res: Response): Promise<void>;
  getActiveMembership(req: Request, res: Response): Promise<void>;
}
