import { Request, Response } from "express";

export interface IWalletPaymentController {
  createOrder(req: Request, res: Response): Promise<void>;
  verifyPayment(req: Request, res: Response): Promise<void>;
}
