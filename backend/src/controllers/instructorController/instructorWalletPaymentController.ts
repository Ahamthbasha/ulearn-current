import { Response } from "express";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { Model, Roles, StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IInstructorWalletPaymentController } from "./interfaces/IInstructorWalletPaymentController";
import { INSTRUCTOR_ERROR_MESSAGE } from "../../utils/constants";

export class InstructorWalletPaymentController
  implements IInstructorWalletPaymentController
{
  private _walletPaymentService: IWalletPaymentService;
  constructor(walletPaymentService: IWalletPaymentService) {
    this._walletPaymentService = walletPaymentService;
  }

  async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amount } = req.body;
      const order = await this._walletPaymentService.createOrder(amount);
      res.status(StatusCode.OK).json({ success: true, order });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_CREATE_RAZORPAY_ORDER,
      });
    }
  }

  async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_ID_NOT_FOUND,
        });
        return;
      }

      const wallet = await this._walletPaymentService.verifyAndCreditWallet({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        userId,
        role: Roles.INSTRUCTOR,
        onModel: Model.INSTRUCTOR,
      });

      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message:
          error.message || INSTRUCTOR_ERROR_MESSAGE.PAYMENT_VERIFICATION_FAILED,
      });
    }
  }
}
