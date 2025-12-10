import { Types } from "mongoose";
import mongoose from "mongoose";
import { IOrder } from "../../../models/orderModel";
import { IEnrollment } from "../../../models/enrollmentModel";
import { ILearningPathEnrollment } from "../../../models/learningPathEnrollmentModel";
import { ICourseRepository } from "../../../repositories/interfaces/ICourseRepository";
import { ILearningPathRepository } from "../../../repositories/interfaces/ILearningPathRepository";
import { ICourseOffer } from "../../../models/courseOfferModel";

export interface IStudentCheckoutRepository {
  createOrder(
    orderData: Partial<IOrder>,
    session?: mongoose.ClientSession,
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

  createEnrollments(
    enrollments: Partial<IEnrollment>[],
    session?: mongoose.ClientSession,
  ): Promise<IEnrollment[]>;

  createLearningPathEnrollments(
    enrollments: Partial<ILearningPathEnrollment>[],
    session?: mongoose.ClientSession,
  ): Promise<ILearningPathEnrollment[]>;

  getCourseNamesByIds(
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<string[]>;

  getLearningPathNamesByIds(
    learningPathIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<{ name: string; totalPrice: number }[]>;

  getEnrolledCourseIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]>;

  getEnrolledLearningPathIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]>;

  getAllCourseIdsFromLearningPaths(
    learningPathIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]>;

  findPendingOrderWithOverlappingCourses(
    userId: Types.ObjectId,
    purchasedCourseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null>;

  getOrderByIdWithLock(
    orderId: Types.ObjectId,
    session: mongoose.ClientSession,
  ): Promise<IOrder | null>;

  getCourseRepo(): ICourseRepository;

  getLearningPathRepo(): ILearningPathRepository;

  getOrderById(orderId: Types.ObjectId): Promise<IOrder | null>;

  markStalePendingOrdersAsFailed(
    userId: Types.ObjectId,
    purchasedCourseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<void>;

  getValidCourseOffers(
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<Map<string, ICourseOffer>>;
}
