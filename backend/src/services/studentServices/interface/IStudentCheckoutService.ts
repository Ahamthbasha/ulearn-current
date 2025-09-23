import { Types } from "mongoose";
import { IOrder } from "../../../models/orderModel";
import { IPayment } from "../../../models/paymentModel";
import { IEnrollment } from "../../../models/enrollmentModel";
import mongoose from "mongoose";
export interface IStudentCheckoutService {
  initiateCheckout(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    paymentMethod: "wallet" | "razorpay"
  ): Promise<IOrder>;

  verifyAndCompleteCheckout(
    orderId: Types.ObjectId,
    paymentId: string,
    method: string,
    amount: number,
    session?: mongoose.ClientSession
  ): Promise<{
    order: IOrder;
    payment: IPayment;
    enrollments: IEnrollment[];
  }>;

  cancelPendingOrder(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<void>;

  markOrderAsFailed(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<void>;

  updateOrderStatus(
    orderId: Types.ObjectId,
    status: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING",
    userId?: Types.ObjectId,
    session?:mongoose.ClientSession
  ): Promise<IOrder | null>;

  updateOrder(
    orderId: Types.ObjectId,
    updates: Partial<IOrder>,
    userId?: Types.ObjectId,
    session?: mongoose.ClientSession
  ): Promise<IOrder | null>;
}