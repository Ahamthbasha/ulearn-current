import { Response } from "express";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { Model, Roles, StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IAdminWalletPaymentController } from "./interface/IAdminWalletPaymentController";
import { AdminSuccessMessages } from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import { BadRequestError, UnauthorizedError } from "../../utils/error";
import { handleControllerError } from "../../utils/errorHandlerUtil";

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

      // Validation
      if (!amount) {
        throw new BadRequestError("Amount is required");
      }

      const parsedAmount = parseFloat(amount);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new BadRequestError("Amount must be a positive number");
      }

      const MIN_AMOUNT = 1;
      if (parsedAmount < MIN_AMOUNT) {
        throw new BadRequestError(
          `Minimum recharge amount is ₹${MIN_AMOUNT}`
        );
      }

      const order = await this._walletPaymentService.createOrder(parsedAmount);

      res.status(StatusCode.OK).json({
        success: true,
        message: "Payment order created successfully",
        order,
      });
    } catch (error) {
      appLogger.error("Error in createOrder controller", { error });
      handleControllerError(error, res);
    }
  }

  async verifyPayment(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
      } = req.body;

      const userId = req.user?.id;

      // Validation
      if (!userId) {
        throw new UnauthorizedError("User authentication required");
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new BadRequestError("Missing payment verification details");
      }

      if (!amount) {
        throw new BadRequestError("Amount is required");
      }

      const parsedAmount = parseFloat(amount);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new BadRequestError("Invalid amount");
      }

      const wallet = await this._walletPaymentService.verifyAndCreditWallet({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount: parsedAmount,
        userId,
        role: Roles.ADMIN,
        onModel: Model.ADMIN,
      });

      res.status(StatusCode.OK).json({
        success: true,
        message: AdminSuccessMessages.ADMIN_WALLET_RECHARGED_SUCCESSFULLY,
        wallet: {
          balance: wallet.balance,
        },
      });
    } catch (error) {
      appLogger.error("Error in verifyPayment controller", { error });
      handleControllerError(error, res);
    }
  }
}