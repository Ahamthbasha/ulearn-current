import { Response } from "express";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { Model, Roles, StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IInstructorWalletPaymentController } from "./interfaces/IInstructorWalletPaymentController";
import { INSTRUCTOR_ERROR_MESSAGE } from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import { NotFoundError} from "../../utils/error";

import { handleControllerError } from "../../utils/errorHandlerUtil";

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
      appLogger.error("Error in create order", { error });
      handleControllerError(error, res);
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
        throw new NotFoundError(
          INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_ID_NOT_FOUND
        );
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
    } catch (error) {
      appLogger.error("Error in verify payment", { error });
      handleControllerError(error, res);
    }
  }
}