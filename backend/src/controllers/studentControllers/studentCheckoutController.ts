import { Request, Response } from "express";
import { IStudentCheckoutController } from "./interfaces/IStudentCheckoutController";
import { IStudentCheckoutService } from "../../services/studentServices/interface/IStudentCheckoutService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import {
  CheckoutErrorMessages,
  CheckoutSuccessMessage,
} from "../../utils/constants";
import { Types } from "mongoose";

export class StudentCheckoutController implements IStudentCheckoutController {
  private _checkoutService: IStudentCheckoutService;

  constructor(checkoutService: IStudentCheckoutService) {
    this._checkoutService = checkoutService;
  }

  async initiateCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseIds = [], learningPathIds = [], totalAmount, paymentMethod, couponId } = req.body;
      const userId = req.user?.id ? new Types.ObjectId(req.user.id) : null;

      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: CheckoutErrorMessages.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      if (courseIds.length === 0 && learningPathIds.length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "At least one course or learning path ID is required",
        });
        return;
      }

      if (typeof totalAmount !== "number" || totalAmount <= 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Total amount must be a positive number",
        });
        return;
      }

      if (!["wallet", "razorpay"].includes(paymentMethod)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid payment method",
        });
        return;
      }

      if (couponId && !Types.ObjectId.isValid(couponId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid coupon ID",
        });
        return;
      }

      const order = await this._checkoutService.initiateCheckout(
        userId,
        courseIds.map((id: string) => new Types.ObjectId(id)),
        learningPathIds.map((id: string) => new Types.ObjectId(id)),
        totalAmount,
        paymentMethod,
        couponId ? new Types.ObjectId(couponId) : undefined,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.ORDER_CREATED,
        order,
      });
    } catch (error: any) {
      console.error("Initiate checkout error:", error);

      const errorMsg = error.message || CheckoutErrorMessages.CHECKOUT_FAILED;
      if (
        errorMsg.includes("already enrolled") ||
        errorMsg.includes("they are included in the learning path(s)") ||
        errorMsg.includes("Insufficient wallet balance") ||
        errorMsg.includes("Invalid coupon") ||
        errorMsg.includes("Coupon is expired or inactive") ||
        errorMsg.includes("Minimum purchase amount") ||
        errorMsg.includes("Coupon already used by this user")
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: errorMsg,
        });
        return;
      }

      if (errorMsg.includes("A pending order already exists")) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: errorMsg,
          orderId: error.orderId,
        });
        return;
      }

      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMsg,
      });
    }
  }

  async completeCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, paymentId, method, amount } = req.body;

      if (!Types.ObjectId.isValid(orderId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid order ID",
        });
        return;
      }

      if (!paymentId || typeof paymentId !== "string") {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid payment ID",
        });
        return;
      }

      if (!["wallet", "razorpay"].includes(method)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid payment method",
        });
        return;
      }

      if (typeof amount !== "number" || amount <= 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Amount must be a positive number",
        });
        return;
      }

      const result = await this._checkoutService.verifyAndCompleteCheckout(
        new Types.ObjectId(orderId),
        paymentId,
        method,
        amount,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.PAYMENT_SUCCESS_COURSE_ENROLLED,
        data: result,
      });
    } catch (error: any) {
      console.error("Payment Completion Error:", error);
      const errorMsg = error.message || CheckoutErrorMessages.PAYMENT_FAILED;

      if (
        errorMsg.includes("Order not found") ||
        errorMsg.includes("Order already processed") ||
        errorMsg.includes("Order cannot be processed") ||
        errorMsg.includes("Payment amount mismatch") ||
        errorMsg.includes("already enrolled")
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: errorMsg,
        });
        return;
      }

      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: CheckoutErrorMessages.PAYMENT_FAILED,
      });
    }
  }

  async cancelPendingOrder(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { orderId } = req.body;
      const userId = new Types.ObjectId(req.user?.id);

      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: CheckoutErrorMessages.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      if (!orderId || !Types.ObjectId.isValid(orderId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid order ID",
        });
        return;
      }

      await this._checkoutService.cancelPendingOrder(
        new Types.ObjectId(orderId),
        userId,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.ORDER_CANCELLED_SUCCESSFULLY,
      });
    } catch (error: any) {
      console.error("Cancel Order Error:", error);
      const errorMsg = error.message || CheckoutErrorMessages.FAILED_TO_CANCEL_ORDER;

      if (
        errorMsg.includes("Order not found") ||
        errorMsg.includes("Unauthorized to cancel this order") ||
        errorMsg.includes("Only pending orders can be cancelled")
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: errorMsg,
        });
        return;
      }

      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: CheckoutErrorMessages.FAILED_TO_CANCEL_ORDER,
      });
    }
  }

  async markOrderAsFailed(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { orderId } = req.body;
      const userId = new Types.ObjectId(req.user?.id);

      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: CheckoutErrorMessages.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      if (!orderId || !Types.ObjectId.isValid(orderId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid order ID",
        });
        return;
      }

      await this._checkoutService.markOrderAsFailed(
        new Types.ObjectId(orderId),
        userId,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.ORDER_MARKED_AS_FAILED_SUCCESSFULLY,
      });
    } catch (error: any) {
      console.error("Mark Order as Failed Error:", error);
      const errorMsg = error.message || CheckoutErrorMessages.FAILED_TO_MARK_ORDER_AS_FAILED;

      if (
        errorMsg.includes("Order not found") ||
        errorMsg.includes("Unauthorized to mark this order as failed") ||
        errorMsg.includes("Only pending orders can be marked as failed")
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: errorMsg,
        });
        return;
      }

      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: CheckoutErrorMessages.FAILED_TO_MARK_ORDER_AS_FAILED,
      });
    }
  }
}