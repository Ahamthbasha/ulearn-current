import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authenticatedRoutes";

export interface IStudentCheckoutController {
  initiateCheckout(req: AuthenticatedRequest, res: Response): Promise<void>;
  completeCheckout(req: Request, res: Response): Promise<void>;
  cancelPendingOrder(req: AuthenticatedRequest, res: Response): Promise<void>;
  markOrderAsFailed(req: AuthenticatedRequest, res: Response): Promise<void>;
}
