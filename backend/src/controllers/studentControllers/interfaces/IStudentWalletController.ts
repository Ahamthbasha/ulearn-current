import { AuthenticatedRequest } from "../../../middlewares/AuthenticatedRoutes";
import {Response} from "express"

export interface IStudentWalletController {
  getWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  creditWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  debitWallet(req: AuthenticatedRequest, res: Response): Promise<void>;
  getPaginatedTransactions(req: AuthenticatedRequest, res: Response): Promise<void>;
}