import { Request, Response } from "express";
import { IStudentCheckoutController } from "./interfaces/IStudentCheckoutController";
import { IStudentCheckoutService } from "../../services/interface/IStudentCheckoutService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";
import { CheckoutErrorMessages, CheckoutSuccessMessage } from "../../utils/constants";
import { Types } from "mongoose";

export class StudentCheckoutController implements IStudentCheckoutController {
  constructor(private readonly checkoutService: IStudentCheckoutService) {}

  async initiateCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const order = await this.checkoutService.initiateCheckout(
        userId,
        courseIds,
        totalAmount,
        paymentMethod  // 👈 required now
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: CheckoutSuccessMessage.ORDER_CREATED,
        order,
      });

    } catch (error: any) {
      const errorMsg = error.message || CheckoutErrorMessages.CHECKOUT_FAILED;

      if (errorMsg.includes("already enrolled") || errorMsg.includes("Insufficient wallet")) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: errorMsg,
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

      const result = await this.checkoutService.verifyAndCompleteCheckout(
        orderId,
        paymentId,
        method,
        amount
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
}
