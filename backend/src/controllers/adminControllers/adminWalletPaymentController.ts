import { Response } from "express";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { Model, Roles, StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IAdminWalletPaymentController } from "./interface/IAdminWalletPaymentController";
import { AdminErrorMessages } from "../../utils/constants";

export class AdminWalletPaymentController
  implements IAdminWalletPaymentController
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
        message: AdminErrorMessages.ADMIN_FAILED_TO_ADD_RAZORPAY,
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
          message: AdminErrorMessages.ADMIN_NOT_FOUND,
        });
        return;
      }

      const wallet = await this._walletPaymentService.verifyAndCreditWallet({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        userId,
        role: Roles.ADMIN,
        onModel: Model.ADMIN,
      });

      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message:
          error.message || AdminErrorMessages.ADMIN_PAYMENT_VERIFICATION_FAILED,
      });
    }
  }
}
