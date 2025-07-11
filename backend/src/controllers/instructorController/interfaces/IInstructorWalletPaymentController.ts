import { Request, Response } from "express";

export interface IInstructorWalletPaymentController {
  createOrder(req: Request, res: Response): Promise<void>;
  verifyPayment(req: Request, res: Response): Promise<void>;
}
