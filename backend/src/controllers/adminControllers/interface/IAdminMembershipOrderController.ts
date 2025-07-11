import { Request, Response } from "express";

export interface IAdminMembershipOrderController {
  getAllOrders(req: Request, res: Response): Promise<void>;
  getOrderDetail(req: Request, res: Response): Promise<void>;
}
