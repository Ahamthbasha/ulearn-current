import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authenticatedRoutes";

export interface IAdminWithdrawalController {
  getAllWithdrawalRequests(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void>;
  approveWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void>;
  rejectWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void>;
  getWithdrawalRequestById(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void>;
}
