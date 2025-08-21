import { Request, Response } from "express";
import { IAdminMembershipOrderController } from "./interface/IAdminMembershipOrderController";
import { IAdminMembershipOrderService } from "../../services/adminServices/interface/IAdminMembershipOrderService";
import { StatusCode } from "../../utils/enums";

export class AdminMembershipOrderController
  implements IAdminMembershipOrderController
{
  private _membershipOrderService: IAdminMembershipOrderService;
  constructor(membershipOrderService: IAdminMembershipOrderService) {
    this._membershipOrderService = membershipOrderService;
  }

  async getAllOrders(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const { data, total } = await this._membershipOrderService.getAllOrders(
      page,
      limit,
      search,
    );

    res.status(StatusCode.OK).json({ data, total });
  }

  async getOrderDetail(req: Request, res: Response): Promise<void> {
    const { txnId } = req.params;
    const order = await this._membershipOrderService.getOrderDetail(txnId);
    res.status(StatusCode.OK).json({ data: order });
  }
}
