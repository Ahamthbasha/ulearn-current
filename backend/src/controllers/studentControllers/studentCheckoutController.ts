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

  async initiateCheckout(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { courseIds, totalAmount, paymentMethod } = req.body;
      const userId = new Types.ObjectId(req.user?.id);

      if (!userId || !paymentMethod) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: CheckoutErrorMessages.USER_NOT_AUTHENTICATED,
        });
        return;
      }

      const order = await this._checkoutService.initiateCheckout(
        userId,
        courseIds,
        totalAmount,
        paymentMethod,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.ORDER_CREATED,
        order,
      });
    } catch (error: any) {
      console.log("Initiate checkout error:", error);
      const errorMsg = error.message || CheckoutErrorMessages.CHECKOUT_FAILED;

      if (
        errorMsg.includes(CheckoutErrorMessages.ALREADY_ENROLLED) ||
        errorMsg.includes(CheckoutErrorMessages.INSUFFICIENT_WALLET)
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: errorMsg,
        });
        return;
      }

      if (errorMsg.includes(CheckoutErrorMessages.PENDING_ORDER_EXISTS)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: errorMsg,
          orderId: error.orderId,
        });
        return;
      }

      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: CheckoutErrorMessages.CHECKOUT_FAILED,
      });
    }
  }

  async completeCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, paymentId, method, amount } = req.body;

      const result = await this._checkoutService.verifyAndCompleteCheckout(
        orderId,
        paymentId,
        method,
        amount,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.PAYMENT_SUCCESS_COURSE_ENROLLED,
        data: result,
      });
    } catch (error) {
      console.error("Payment Completion Error:", error);
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

      if (!orderId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: CheckoutErrorMessages.ORDER_ID_REQUIRED,
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
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || CheckoutErrorMessages.FAILED_TO_CANCEL_ORDER,
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

      if (!orderId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: CheckoutErrorMessages.ORDER_ID_REQUIRED,
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
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message || CheckoutErrorMessages.FAILED_TO_MARK_ORDER_AS_FAILED,
      });
    }
  }
}
