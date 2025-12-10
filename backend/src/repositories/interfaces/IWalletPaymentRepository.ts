import { IRazorpayOrder } from "../../types/razorpay";

export interface IWalletPaymentRepository {
  createRazorpayOrder(amount: number): Promise<IRazorpayOrder>;
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean;
}
