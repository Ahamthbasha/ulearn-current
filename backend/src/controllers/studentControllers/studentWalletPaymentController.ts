import { Response } from "express";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";

export class StudentWalletPaymentController {
  constructor(private walletPaymentService: IWalletPaymentService) {}

  async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amount } = req.body;
      const order = await this.walletPaymentService.createOrder(amount);
      res.status(StatusCode.OK).json({ success: true, order });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to create Razorpay order",
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
          message: "User ID not found",
        });
        return;
      }

      const wallet = await this.walletPaymentService.verifyAndCreditWallet({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        amount,
        userId,
        role: "student", 
        onModel: "User", 
      });

      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message || "Payment verification failed",
      });
    }
  }
}
