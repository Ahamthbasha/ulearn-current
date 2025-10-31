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
import { appLogger } from "../../utils/logger";
import mongoose from "mongoose";
import { handleControllerError, BadRequestError } from "../../utils/errorHandlerUtil";

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
      const {
        courseIds = [],
        learningPathIds = [],
        totalAmount,
        paymentMethod,
        couponId,
      } = req.body;
      const userId = req.user?.id ? new Types.ObjectId(req.user.id) : null;

      if (!userId) {
        throw new BadRequestError(CheckoutErrorMessages.USER_NOT_AUTHENTICATED);
      }

      if (courseIds.length === 0 && learningPathIds.length === 0) {
        throw new BadRequestError("At least one course or learning path ID is required");
      }

      if (typeof totalAmount !== "number" || totalAmount <= 0) {
        throw new BadRequestError("Total amount must be a positive number or remove that item from the cart");
      }

      if (!["wallet", "razorpay"].includes(paymentMethod)) {
        throw new BadRequestError("Invalid payment method");
      }

      if (couponId && !Types.ObjectId.isValid(couponId)) {
        throw new BadRequestError("Invalid coupon ID");
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
    } catch (error: unknown) {
      appLogger.error("Initiate checkout error:", error);
      handleControllerError(error, res);
    }
  }

  async completeCheckout(req: Request, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    let result;
    try {
      const { orderId, paymentId, method, amount } = req.body;

      if (!Types.ObjectId.isValid(orderId)) {
        throw new BadRequestError("Invalid order ID");
      }

      if (!paymentId || typeof paymentId !== "string") {
        throw new BadRequestError("Invalid payment ID");
      }

      if (!["wallet", "razorpay"].includes(method)) {
        throw new BadRequestError("Invalid payment method");
      }

      if (typeof amount !== "number" || amount <= 0) {
        throw new BadRequestError("Amount must be a positive number");
      }

      await session.withTransaction(async () => {
        result = await this._checkoutService.verifyAndCompleteCheckout(
          new Types.ObjectId(orderId),
          paymentId,
          method,
          amount,
          session,
        );
      });

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.PAYMENT_SUCCESS_COURSE_ENROLLED,
        data: result,
      });
    } catch (error: unknown) {
      appLogger.error("Payment Completion Error:", error);
      handleControllerError(error, res);
    } finally {
      await session.endSession();
    }
  }

  async cancelPendingOrder(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { orderId } = req.body;
      const userId = new Types.ObjectId(req.user?.id!);

      if (!userId) {
        throw new BadRequestError(CheckoutErrorMessages.USER_NOT_AUTHENTICATED);
      }

      if (!orderId || !Types.ObjectId.isValid(orderId)) {
        throw new BadRequestError("Invalid order ID");
      }

      await this._checkoutService.cancelPendingOrder(
        new Types.ObjectId(orderId),
        userId,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.ORDER_CANCELLED_SUCCESSFULLY,
      });
    } catch (error: unknown) {
      appLogger.error("Cancel Order Error:", error);
      handleControllerError(error, res);
    }
  }

  async markOrderAsFailed(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { orderId } = req.body;
      const userId = new Types.ObjectId(req.user?.id!);

      if (!userId) {
        throw new BadRequestError(CheckoutErrorMessages.USER_NOT_AUTHENTICATED);
      }

      if (!orderId || !Types.ObjectId.isValid(orderId)) {
        throw new BadRequestError("Invalid order ID");
      }

      await this._checkoutService.markOrderAsFailed(
        new Types.ObjectId(orderId),
        userId,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.ORDER_MARKED_AS_FAILED_SUCCESSFULLY,
      });
    } catch (error: unknown) {
      appLogger.error("Mark Order as Failed Error:", error);
      handleControllerError(error, res);
    }
  }
}