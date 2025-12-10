import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authenticatedRoutes";

export interface IInstructorWithdrawalController {
  createWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void>;
  getWithdrawalRequestsWithPagination(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void>;
  retryWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void>;
}
