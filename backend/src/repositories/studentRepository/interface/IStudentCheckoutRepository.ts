import { Types } from "mongoose";
import { IOrder } from "../../../models/orderModel";
import { IPayment } from "../../../models/paymentModel";
import { IEnrollment } from "../../../models/enrollmentModel";
import { ICourseRepository } from "../../../repositories/interfaces/ICourseRepository";
export interface IStudentCheckoutRepository {
  createOrder(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    amount: number,
    razorpayOrderId: string
  ): Promise<IOrder>;

  updateOrderStatus(
    orderId: Types.ObjectId,
    status: "SUCCESS" | "FAILED"
  ): Promise<IOrder | null>;

  savePayment(data: Partial<IPayment>): Promise<IPayment>;

  createEnrollments(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[]
  ): Promise<IEnrollment[]>;

  getCourseNamesByIds(courseIds: Types.ObjectId[]): Promise<string[]>;

  getEnrolledCourseIds(userId: Types.ObjectId): Promise<Types.ObjectId[]>;

  getCourseRepo(): ICourseRepository;

  getOrderById(orderId:Types.ObjectId):Promise<IOrder | null>
}
