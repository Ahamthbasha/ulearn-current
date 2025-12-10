
import { IWalletPaymentRepository } from "./interfaces/IWalletPaymentRepository";
import { razorpay } from "../utils/razorpay";
import crypto from "crypto";
import { IRazorpayOrder } from "../types/razorpay"; 
import { InternalServerError, BadRequestError } from "../utils/error";
import { appLogger } from "../utils/logger";

export class WalletPaymentRepository implements IWalletPaymentRepository {
  async createRazorpayOrder(amount: number): Promise<IRazorpayOrder> {
    try {
      if (!amount || amount <= 0) {
        throw new BadRequestError("Invalid amount for order creation");
      }

      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: `wallet_rcpt_${Date.now()}`,
        payment_capture: true,
      });

      return order as IRazorpayOrder;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      appLogger.error("Error creating Razorpay order", { 
        error, 
        amount 
      });

      throw new InternalServerError(
        "Failed to create payment order. Please try again."
      );
    }
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    try {
      if (!orderId || !paymentId || !signature) {
        throw new BadRequestError(
          "Missing required payment verification parameters"
        );
      }

      const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!razorpaySecret) {
        appLogger.error("Razorpay key secret not configured");
        throw new InternalServerError("Payment configuration error");
      }

      const hmac = crypto.createHmac("sha256", razorpaySecret);
      hmac.update(`${orderId}|${paymentId}`);
      const digest = hmac.digest("hex");

      return digest === signature;
    } catch (error) {
      if (
        error instanceof BadRequestError || 
        error instanceof InternalServerError
      ) {
        throw error;
      }

      appLogger.error("Error verifying payment signature", { 
        error,
        orderId,
        paymentId 
      });

      throw new InternalServerError("Payment verification failed");
    }
  }
}