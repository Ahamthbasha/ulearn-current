import { Response } from "express";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { Model, Roles, StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StudentErrorMessages } from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import { handleControllerError } from "../../utils/errorHandlerUtil";
import { IStudentWalletPaymentController } from "./interfaces/IStudentWalletPaymentController";

export class StudentWalletPaymentController implements IStudentWalletPaymentController {
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
      appLogger.error("error in create order", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_CREATE_RAZORPAY_ORDER,
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
          message: StudentErrorMessages.USERID_NOT_FOUND,
        });
        return;
      }

      const wallet = await this._walletPaymentService.verifyAndCreditWallet({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        userId,
        role: Roles.STUDENT,
        onModel: Model.USER,
      });

      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error: unknown) {
      appLogger.error("error in verify payment", error);
      handleControllerError(error,res)
    }
  }
}