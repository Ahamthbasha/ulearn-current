import { Types } from "mongoose";
import mongoose from "mongoose";
import { IOrder } from "../../../models/orderModel";
import { IEnrollment } from "../../../models/enrollmentModel";
import { ICourseRepository } from "../../../repositories/interfaces/ICourseRepository";
import { ILearningPathRepository } from "../../../repositories/interfaces/ILearningPathRepository";

export interface IStudentCheckoutService {
  initiateCheckout(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    learningPathIds: Types.ObjectId[],
    totalAmount: number,
    paymentMethod: "wallet" | "razorpay",
    couponId?: Types.ObjectId,
  ): Promise<IOrder>;

  verifyAndCompleteCheckout(
    orderId: Types.ObjectId,
    paymentId: string,
    method: string,
    amount: number,
    session?: mongoose.ClientSession,
  ): Promise<{
    order: IOrder;
    enrollments: IEnrollment[];
  }>;

  cancelPendingOrder(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<void>;

  markOrderAsFailed(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<void>;

  updateOrderStatus(
    orderId: Types.ObjectId,
    status: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING",
    userId?: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null>;

  updateOrder(
    orderId: Types.ObjectId,
    updates: Partial<IOrder>,
    userId?: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null>;

  getEnrolledCourseIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]>;

  getEnrolledLearningPathIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]>;

  getCourseRepo(): ICourseRepository;

  getLearningPathRepo(): ILearningPathRepository;
}
