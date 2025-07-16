import { Request, Response } from "express";

export interface IInstructorMembershipOrderController {
  initiateCheckout(req: Request, res: Response): Promise<void>;
  verifyOrder(req: Request, res: Response): Promise<void>;
  purchaseWithWallet(req: Request, res: Response): Promise<void>;
  getInstructorOrders(req: Request, res: Response): Promise<void>;
  getMembershipOrderDetail(req: Request, res: Response): Promise<void>;
  downloadReceipt(req: Request, res: Response): Promise<void>;
}
