import { Types } from "mongoose";
import mongoose from "mongoose";
import { IOrder } from "../../../models/orderModel";
import { IPayment } from "../../../models/paymentModel";
import { IEnrollment } from "../../../models/enrollmentModel";
import { ICourseRepository } from "../../../repositories/interfaces/ICourseRepository";

export interface IStudentCheckoutRepository {
  createOrder(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    amount: number,
    razorpayOrderId: string,
    session?: mongoose.ClientSession,
    couponId?:Types.ObjectId
  ): Promise<IOrder>;

  updateOrderStatus(
    orderId: Types.ObjectId,
    status: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING",
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null>;

  updateOrder(
    orderId: Types.ObjectId,
    updates: Partial<IOrder>,
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null>;

  savePayment(
    data: Partial<IPayment>,
    session?: mongoose.ClientSession,
  ): Promise<IPayment>;

  createEnrollments(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<IEnrollment[]>;

  getCourseNamesByIds(
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<string[]>;

  getEnrolledCourseIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]>;

  findPendingOrderForCourses(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null>;

  getOrderByIdWithLock(
    orderId: Types.ObjectId,
    session: mongoose.ClientSession,
  ): Promise<IOrder | null>;

  getCourseRepo(): ICourseRepository;

  getOrderById(orderId: Types.ObjectId): Promise<IOrder | null>;

  markStalePendingOrdersAsFailed(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<void>;
}
