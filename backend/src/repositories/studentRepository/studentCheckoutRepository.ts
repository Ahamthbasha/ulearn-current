import { IStudentCheckoutRepository } from "./interface/IStudentCheckoutRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { IPaymentRepository } from "../interfaces/IPaymentRepository";
import { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository";
import { ICourseRepository } from "../interfaces/ICourseRepository";

import { Types } from "mongoose";
import { IOrder } from "../../models/orderModel";
import { IPayment } from "../../models/paymentModel";
import { IEnrollment } from "../../models/enrollmentModel";

export class StudentCheckoutRepository implements IStudentCheckoutRepository {
  private _orderRepo: IOrderRepository;
  private _paymentRepo: IPaymentRepository;
  private _enrollmentRepo: IEnrollmentRepository;
  private _courseRepo: ICourseRepository;
  constructor(
    orderRepo: IOrderRepository,
    paymentRepo: IPaymentRepository,
    enrollmentRepo: IEnrollmentRepository,
    courseRepo: ICourseRepository, // for course name check
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
  ): Promise<IOrder> {
    return this._orderRepo.create({
      userId,
      courses: courseIds,
      amount,
      status: "PENDING",
      gateway: "razorpay",
      gatewayOrderId: razorpayOrderId,
    } as Partial<IOrder>);
  }

  async updateOrderStatus(
    orderId: Types.ObjectId,
    status: "SUCCESS" | "FAILED",
  ): Promise<IOrder | null> {
    return this._orderRepo.update(orderId.toString(), { status });
  }

  async savePayment(data: Partial<IPayment>): Promise<IPayment> {
    return this._paymentRepo.create(data);
  }

  async createEnrollments(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
  ): Promise<IEnrollment[]> {
    const enrollments = courseIds.map((courseId) => ({
      userId,
      courseId,
      completionStatus: "NOT_STARTED",
      certificateGenerated: false,
      enrolledAt: new Date(),
    }));
    return this._enrollmentRepo.create(enrollments as Partial<IEnrollment>[]);
  }

  async getCourseNamesByIds(courseIds: Types.ObjectId[]): Promise<string[]> {
    const courses = await this._courseRepo.findAll({ _id: { $in: courseIds } });
    return (courses || []).map((c) => c.courseName);
  }

  async getEnrolledCourseIds(
    userId: Types.ObjectId,
  ): Promise<Types.ObjectId[]> {
    const enrollments = (await this._enrollmentRepo.findAll({ userId })) || [];
    return enrollments.map((e) => e.courseId);
  }

  getCourseRepo(): ICourseRepository {
    return this._courseRepo;
  }

  async getOrderById(orderId: Types.ObjectId): Promise<IOrder | null> {
    return this._orderRepo.findById(orderId.toString());
  }
}
