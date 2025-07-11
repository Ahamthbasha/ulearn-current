import { IWalletPaymentRepository } from "./interfaces/IWalletPaymentRepository";
import { razorpay } from "../utils/razorpay";
import crypto from "crypto";

export class WalletPaymentRepository implements IWalletPaymentRepository {
  async createRazorpayOrder(amount: number): Promise<any> {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `wallet_rcpt_${Date.now()}`,
      payment_capture: true,
    });
    return order;
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${orderId}|${paymentId}`);
    const digest = hmac.digest("hex");
    return digest === signature;
  }
}
