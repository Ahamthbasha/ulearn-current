import { Request, Response } from "express";
import { IAdminMembershipOrderController } from "./interface/IAdminMembershipOrderController";
import { IAdminMembershipOrderService } from "../../services/adminServices/interface/IAdminMembershipOrderService";
import { StatusCode } from "../../utils/enums";
import {
  MEMBERSHIP_ORDER_ERROR_MESSAGE,
  MEMBERSHIP_ORDER_SUCCESS_MESSAGE,
} from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import {
  IGetAllOrdersResponse,
  IGetOrderDetailResponse,
} from "../../interface/adminInterface/IadminInterface";
import { MembershipOrderValidator } from "../../utils/adminUtilities/membershipOrderValidator";

export class AdminMembershipOrderController implements IAdminMembershipOrderController {
  constructor(private readonly service: IAdminMembershipOrderService) {}

  private parseQuery(req: Request) {
  const rawStatus = req.query.status as string | undefined;
  const validStatuses = ["paid", "failed", "cancelled"];
  const status =
    rawStatus && validStatuses.includes(rawStatus)
      ? rawStatus as "paid" | "failed" | "cancelled"
      : undefined;

  return {
    page: req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : 1,
    limit: req.query.limit ? Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10))) : 10,
    search: (req.query.search as string | undefined)?.trim() || undefined,
    status,
  };
}


  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, status } = this.parseQuery(req);

      const err = MembershipOrderValidator.validateList({ page, limit, search, status });
      if (err) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ success: false, message: err } as IGetAllOrdersResponse);
        return;
      }

      const { data, total } = await this.service.getAllOrders(page, limit, search, status);

      res.status(StatusCode.OK).json({
        success: true,
        message: MEMBERSHIP_ORDER_SUCCESS_MESSAGE.FETCH_ORDERS_SUCCESS,
        data,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      } as IGetAllOrdersResponse);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : MEMBERSHIP_ORDER_ERROR_MESSAGE.FAILED_TO_FETCH_ORDERS;
      appLogger.error("Get all orders error:", e);
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: msg } as IGetAllOrdersResponse);
    }
  }

  async getOrderDetail(req: Request, res: Response): Promise<void> {
    try {
      const { razorpayOrderId } = req.params;

      const err = MembershipOrderValidator.validateDetail({ razorpayOrderId });
      if (err) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ success: false, message: err } as IGetOrderDetailResponse);
        return;
      }

      const order = await this.service.getOrderDetail(razorpayOrderId);
      res.status(StatusCode.OK).json({
        success: true,
        message: MEMBERSHIP_ORDER_SUCCESS_MESSAGE.FETCH_ORDER_DETAIL_SUCCESS,
        data: order,
      } as IGetOrderDetailResponse);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : MEMBERSHIP_ORDER_ERROR_MESSAGE.GENERIC;
      if (msg === "Order not found") {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ success: false, message: MEMBERSHIP_ORDER_ERROR_MESSAGE.ORDER_NOT_FOUND } as IGetOrderDetailResponse);
        return;
      }
      appLogger.error("Get order detail error:", e);
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: msg } as IGetOrderDetailResponse);
    }
  }
}