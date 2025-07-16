import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/AuthenticatedRoutes";

export interface IStudentSlotBookingController {
  initiateCheckout(req: AuthenticatedRequest, res: Response): Promise<void>;
  verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void>;
  bookViaWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  getBookingHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
  getBookingDetail(req: AuthenticatedRequest, res: Response): Promise<void>;
  downloadReceipt(req: AuthenticatedRequest, res: Response): Promise<void>;
}
