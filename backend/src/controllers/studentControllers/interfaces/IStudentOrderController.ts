import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authenticatedRoutes";

export interface IStudentOrderController {
  getOrderHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
  getOrderDetails(req: AuthenticatedRequest, res: Response): Promise<void>;
  downloadInvoice(req: AuthenticatedRequest, res: Response): Promise<void>;
  retryPayment(req: AuthenticatedRequest, res: Response): Promise<void>;
}