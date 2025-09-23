import { Types } from "mongoose";
import mongoose from "mongoose";
import { IOrder } from "../../models/orderModel";
import { IPayment } from "../../models/paymentModel";
import { IEnrollment } from "../../models/enrollmentModel";
import { IStudentCheckoutRepository } from "./interface/IStudentCheckoutRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { IPaymentRepository } from "../interfaces/IPaymentRepository";
import { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository";
import { ICourseRepository } from "../interfaces/ICourseRepository";

export class StudentCheckoutRepository implements IStudentCheckoutRepository {
  private _orderRepo: IOrderRepository;
  private _paymentRepo: IPaymentRepository;
  private _enrollmentRepo: IEnrollmentRepository;
  private _courseRepo: ICourseRepository;

  constructor(
    orderRepo: IOrderRepository,
    paymentRepo: IPaymentRepository,
    enrollmentRepo: IEnrollmentRepository,
    courseRepo: ICourseRepository
  ) {
    this._courseRepo = courseRepo;
    this._orderRepo = orderRepo;
    this._paymentRepo = paymentRepo;
    this._enrollmentRepo = enrollmentRepo;
  }

  async createOrder(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    amount: number,
    razorpayOrderId: string,
    session?: mongoose.ClientSession
  ): Promise<IOrder> {
    const orderData = {
      userId,
      courses: courseIds,
      amount,
      status: "PENDING" as const,
      gateway: "razorpay" as const,
      gatewayOrderId: razorpayOrderId,
    } as Partial<IOrder>;

    if (session) {
      return this._orderRepo.createWithSession(orderData, session);
    }
    return this._orderRepo.create(orderData);
  }

  async updateOrderStatus(
    orderId: Types.ObjectId,
    status: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING",
    session?: mongoose.ClientSession
  ): Promise<IOrder | null> {
    if (session) {
      return this._orderRepo.updateWithSession(orderId.toString(), { status }, session);
    }
    return this._orderRepo.update(orderId.toString(), { status });
  }

  async updateOrder(
    orderId: Types.ObjectId,
    updates: Partial<IOrder>,
    session?: mongoose.ClientSession
  ): Promise<IOrder | null> {
    if (session) {
      return this._orderRepo.updateWithSession(orderId.toString(), updates, session);
    }
    return this._orderRepo.update(orderId.toString(), updates);
  }

  async savePayment(data: Partial<IPayment>, session?: mongoose.ClientSession): Promise<IPayment> {
    if (session) {
      return this._paymentRepo.createWithSession(data, session);
    }
    return this._paymentRepo.create(data);
  }

  async createEnrollments(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession
  ): Promise<IEnrollment[]> {
    const enrollments = courseIds.map((courseId) => ({
      userId,
      courseId,
      completionStatus: "NOT_STARTED",
      certificateGenerated: false,
      enrolledAt: new Date(),
    }));

    if (session) {
      return this._enrollmentRepo.createManyWithSession(enrollments as Partial<IEnrollment>[], session);
    }
    return this._enrollmentRepo.create(enrollments as Partial<IEnrollment>[]);
  }

  async getCourseNamesByIds(
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession
  ): Promise<string[]> {
    const filter = { _id: { $in: courseIds } };
    let courses;

    if (session) {
      courses = await this._courseRepo.findAllWithSession(filter, session);
    } else {
      courses = await this._courseRepo.findAll(filter);
    }

    return (courses || []).map((c) => c.courseName);
  }

  async getEnrolledCourseIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession
  ): Promise<Types.ObjectId[]> {
    const filter = { userId };
    let enrollments;

    if (session) {
      enrollments = await this._enrollmentRepo.findAllWithSession(filter, session);
    } else {
      enrollments = await this._enrollmentRepo.findAll(filter);
    }

    return (enrollments || []).map((e) => e.courseId);
  }

  async findPendingOrderForCourses(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession
  ): Promise<IOrder | null> {
    const filter = {
      userId,
      status: "PENDING",
      courses: { $in: courseIds },
    };

    if (session) {
      const orders = await this._orderRepo.findAllWithSession(filter, session);
      return orders && orders.length > 0 ? orders[0] : null;
    }

    const orders = await this._orderRepo.findAll(filter);
    return orders && orders.length > 0 ? orders[0] : null;
  }

  async getOrderByIdWithLock(orderId: Types.ObjectId, session: mongoose.ClientSession): Promise<IOrder | null> {
    return this._orderRepo.findByIdWithLock(orderId.toString(), session);
  }

  getCourseRepo(): ICourseRepository {
    return this._courseRepo;
  }

  async getOrderById(orderId: Types.ObjectId): Promise<IOrder | null> {
    return this._orderRepo.findById(orderId.toString());
  }

  async markStalePendingOrdersAsFailed(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession
  ): Promise<void> {
    const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
    const filter = {
      userId,
      status: "PENDING",
      courses: { $in: courseIds },
      createdAt: { $lte: staleThreshold },
    };

    if (session) {
      await this._orderRepo.updateManyWithSession(filter, { status: "FAILED" }, session);
    } else {
      await this._orderRepo.updateMany(filter, { status: "FAILED" });
    }
  }
}