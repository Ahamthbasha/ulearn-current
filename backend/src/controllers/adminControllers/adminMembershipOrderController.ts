import { Request, Response } from "express";
import { IAdminMembershipOrderController } from "./interface/IAdminMembershipOrderController";
import { IAdminMembershipOrderService } from "../../services/interface/IAdminMembershipOrderService";
import { StatusCode } from "../../utils/enums";

export class AdminMembershipOrderController
  implements IAdminMembershipOrderController
{
  constructor(
    private readonly membershipOrderService: IAdminMembershipOrderService
  ) {}

  async getAllOrders(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, total } = await this.membershipOrderService.getAllOrders(
      page,
      limit
    );
    res.status(StatusCode.OK).json({ data, total });
  }

  async getOrderDetail(req: Request, res: Response): Promise<void> {
    const { txnId } = req.params;
    const order = await this.membershipOrderService.getOrderDetail(txnId);
    res.status(StatusCode.OK).json({ data: order });
  }
  
}
