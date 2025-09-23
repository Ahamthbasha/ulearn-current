import { Response } from "express";
import { Types } from "mongoose";
import { IStudentOrderController } from "./interfaces/IStudentOrderController";
import { IStudentOrderService } from "../../services/studentServices/interface/IStudentOrderService";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { generateInvoicePdf } from "../../utils/generateInvoicePdf";
import { StudentErrorMessages, StudentSuccessMessages } from "../../utils/constants";

export class StudentOrderController implements IStudentOrderController {
  private _orderService: IStudentOrderService;

  constructor(
    orderService: IStudentOrderService,
  ) {
    this._orderService = orderService;
  }

  async getOrderHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const search = req.query.search as string | undefined;

      if (page < 1 || limit < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid pagination parameters",
        });
        return;
      }

      const { orders, total } = await this._orderService.getOrderHistoryPaginated(
        userId,
        page,
        limit,
        search
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.ORDER_HISTORY_FETCHED || "Order history fetched successfully",
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("Error fetching order history:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_FETCH_ORDER_HISTORY,
      });
    }
  }

  async getOrderDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orderId = new Types.ObjectId(req.params.orderId);
      const userId = new Types.ObjectId(req.user!.id);

      if (!req.params.orderId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Order ID is required",
        });
        return;
      }

      const orderDetailsDTO = await this._orderService.getOrderDetails(orderId, userId);

      if (!orderDetailsDTO) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.ORDER_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.ORDER_DETAILS_FETCHED || "Order details fetched successfully",
        order: orderDetailsDTO,
      });
    } catch (err) {
      console.error("Error fetching order details:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_FETCH_ORDER_DETAILS,
      });
    }
  }

  async downloadInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orderId = new Types.ObjectId(req.params.orderId);
      const userId = new Types.ObjectId(req.user!.id);

      if (!req.params.orderId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Order ID is required",
        });
        return;
      }

      const order = await this._orderService.getOrderRaw(orderId, userId);

      if (!order) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.ORDER_NOT_FOUND,
        });
        return;
      }

      if (order.status !== "SUCCESS") {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invoice is only available for successful orders",
        });
        return;
      }

      const pdfBuffer = await generateInvoicePdf(order);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${order._id}.pdf`,
        "Content-Length": pdfBuffer.length.toString(),
      });

      res.send(pdfBuffer);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_DOWNLOAD_INVOICE,
      });
    }
  }

  async retryPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const orderId = new Types.ObjectId(req.params.orderId);
      const userId = new Types.ObjectId(req.user!.id);
      const paymentData = req.body;

      if (!req.params.orderId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Order ID is required",
        });
        return;
      }

      const result = await this._orderService.retryPayment(orderId, userId, paymentData);

      res.status(StatusCode.OK).json(result);
    } catch (err: any) {
      console.error("Error initiating payment retry:", err);
      res.status(
        err.message.includes("already in progress")
          ? StatusCode.CONFLICT
          : StatusCode.INTERNAL_SERVER_ERROR
      ).json({
        success: false,
        message: err.message || "Failed to initiate payment retry",
      });
    }
  }
}