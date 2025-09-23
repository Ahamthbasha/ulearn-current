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
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "";
      
      const { data, total } = await this._membershipOrderService.getAllOrders(
        page,
        limit,
        search,
        status
      );

      res.status(StatusCode.OK).json({ 
        data, 
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        message: error.message || "Failed to fetch orders" 
      });
    }
  }

  async getOrderDetail(req: Request, res: Response): Promise<void> {
    try {
      const { razorpayOrderId } = req.params;
      console.log(razorpayOrderId )
      const order = await this._membershipOrderService.getOrderDetail(razorpayOrderId);
      res.status(StatusCode.OK).json({ data: order });
    } catch (error: any) {
      res.status(StatusCode.NOT_FOUND).json({ 
        message: error.message || "Order not found" 
      });
    }
  }
}
