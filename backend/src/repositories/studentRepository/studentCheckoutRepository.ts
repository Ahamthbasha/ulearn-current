import { IStudentCheckoutRepository } from "../interfaces/IStudentCheckoutRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { IPaymentRepository } from "../interfaces/IPaymentRepository";
import { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository";
import { ICourseRepository } from "../interfaces/ICourseRepository";

import { Types } from "mongoose";
import { IOrder } from "../../models/orderModel";
import { IPayment } from "../../models/paymentModel";
import { IEnrollment } from "../../models/enrollmentModel";

export class StudentCheckoutRepository implements IStudentCheckoutRepository {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly courseRepo: ICourseRepository // for course name check
  ) {}

  async createOrder(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    amount: number,
    razorpayOrderId: string
  ): Promise<IOrder> {
    return this.orderRepo.create({
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
    status: "SUCCESS" | "FAILED"
  ): Promise<IOrder | null> {
    return this.orderRepo.update(orderId.toString(), { status });
  }

  async savePayment(data: Partial<IPayment>): Promise<IPayment> {
    return this.paymentRepo.create(data);
  }

  async createEnrollments(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[]
  ): Promise<IEnrollment[]> {
    const enrollments = courseIds.map((courseId) => ({
      userId,
      courseId,
      completionStatus: "NOT_STARTED",
      certificateGenerated: false,
      enrolledAt: new Date(),
    }));
    return this.enrollmentRepo.create(enrollments as Partial<IEnrollment>[]);
  }

  async getCourseNamesByIds(courseIds: Types.ObjectId[]): Promise<string[]> {
    const courses = await this.courseRepo.findAll({ _id: { $in: courseIds } });
    return (courses || []).map((c) => c.courseName);
  }

  async getEnrolledCourseIds(
    userId: Types.ObjectId
  ): Promise<Types.ObjectId[]> {
    const enrollments = (await this.enrollmentRepo.findAll({ userId })) || [];
    return enrollments.map((e) => e.courseId);
  }

  getCourseRepo(): ICourseRepository {
    return this.courseRepo;
  }
}
