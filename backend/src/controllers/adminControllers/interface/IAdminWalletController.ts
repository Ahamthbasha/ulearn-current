import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/AuthenticatedRoutes";

export interface IAdminWalletController {
  getWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  creditWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  debitWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  getTransactions(req: AuthenticatedRequest, res: Response): Promise<void>;
}
