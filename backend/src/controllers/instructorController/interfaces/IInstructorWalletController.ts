import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/AuthenticatedRoutes";

export interface IInstructorWalletController {
  getWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  creditWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  debitWallet(req: AuthenticatedRequest, res: Response): Promise<void>;

  getPaginatedTransactions(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void>;
}
