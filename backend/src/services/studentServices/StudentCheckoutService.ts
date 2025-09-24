import { IStudentCheckoutService } from "./interface/IStudentCheckoutService";
import { IStudentCheckoutRepository } from "../../repositories/studentRepository/interface/IStudentCheckoutRepository";
import { IStudentCartRepository } from "../../repositories/interfaces/IStudentCartRepository";
import { IWalletService } from "../interface/IWalletService";
import { razorpay } from "../../utils/razorpay";
import { Types } from "mongoose";
import { IOrder } from "../../models/orderModel";
import { IPayment } from "../../models/paymentModel";
import { IEnrollment } from "../../models/enrollmentModel";
import mongoose from "mongoose";

export class StudentCheckoutService implements IStudentCheckoutService {
  private _checkoutRepo: IStudentCheckoutRepository;
  private _cartRepo: IStudentCartRepository;
  private _walletService: IWalletService;

  constructor(
    checkoutRepo: IStudentCheckoutRepository,
    cartRepo: IStudentCartRepository,
    walletService: IWalletService
  ) {
    this._checkoutRepo = checkoutRepo;
    this._cartRepo = cartRepo;
    this._walletService = walletService;
  }

  async initiateCheckout(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    paymentMethod: "wallet" | "razorpay"
  ): Promise<IOrder> {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(userId, session);
        const alreadyEnrolled = courseIds.filter((cid) =>
          enrolledCourseIds.some((eid) => eid.equals(cid))
        );

        if (alreadyEnrolled.length > 0) {
          const names = await this._checkoutRepo.getCourseNamesByIds(alreadyEnrolled, session);
          throw new Error(`Remove ${names.join(", ")} from cart, already enrolled.`);
        }

        await this._checkoutRepo.markStalePendingOrdersAsFailed(userId, courseIds, session);

        const existingOrder = await this._checkoutRepo.findPendingOrderForCourses(
          userId,
          courseIds,
          session
        );

        if (existingOrder) {
          const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
          if (existingOrder.createdAt > staleThreshold) {
            const error = new Error(
              "A pending order already exists for these courses. Please complete or cancel it first."
            );
            (error as any).orderId = existingOrder._id.toString();
            throw error;
          }
          await this._checkoutRepo.updateOrderStatus(existingOrder._id, "FAILED", session);
        }

        if (paymentMethod === "wallet") {
          return await this.processWalletPayment(userId, courseIds, totalAmount, session);
        } else {
          return await this.processRazorpayOrder(userId, courseIds, totalAmount, session);
        }
      });
    } finally {
      await session.endSession();
    }
  }

  private async processWalletPayment(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    session: mongoose.ClientSession
  ): Promise<IOrder> {
    const wallet = await this._walletService.getWallet(userId);
    if (!wallet || wallet.balance < totalAmount) {
      throw new Error("Insufficient wallet balance");
    }

    const order = await this._checkoutRepo.createOrder(
      userId,
      courseIds,
      totalAmount,
      "wallet_txn_" + Date.now(),
      session
    );

    await this._walletService.debitWallet(userId, totalAmount, "Course Purchase", order._id.toString());

    await this._checkoutRepo.updateOrderStatus(order._id, "SUCCESS", session);

    await this._checkoutRepo.savePayment(
      {
        orderId: order._id,
        userId,
        paymentId: order._id.toString(),
        method: "wallet",
        amount: totalAmount,
        status: "SUCCESS",
      },
      session
    );

    await this._checkoutRepo.createEnrollments(userId, courseIds, session);

    await this.processRevenueSharing(courseIds, order._id.toString());

    await this._cartRepo.clear(userId);
    return order;
  }

  private async processRazorpayOrder(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    session: mongoose.ClientSession
  ): Promise<IOrder> {
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    });

    return this._checkoutRepo.createOrder(userId, courseIds, totalAmount, razorpayOrder.id, session);
  }

async verifyAndCompleteCheckout(
  orderId: Types.ObjectId,
  paymentId: string,
  method: string,
  amount: number,
  session: mongoose.ClientSession 
): Promise<{
  order: IOrder;
  payment: IPayment;
  enrollments: IEnrollment[];
}> {
  try {
    console.log(`Verifying payment for order ${orderId}, amount: ${amount}`);
    const order = await this._checkoutRepo.getOrderByIdWithLock(orderId, session);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "SUCCESS") {
      throw new Error("Order already processed");
    }

    if (order.status !== "FAILED" && order.status !== "PENDING") {
      throw new Error("Order cannot be processed");
    }

    if (Math.abs(order.amount - amount) > 0.01) {
      console.error(`Amount mismatch: Expected ${order.amount}, received ${amount}`);
      await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
      //await this._checkoutRepo.updateOrder(orderId, { retryInProgress: false }, session);
      throw new Error("Payment amount mismatch");
    }

    const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(
      order.userId,
      session
    );

    const alreadyEnrolled = order.courses.filter((courseId) =>
      enrolledCourseIds.some((eid) => eid.equals(courseId))
    );

    if (alreadyEnrolled.length > 0) {
      console.warn(`Already enrolled in courses: ${alreadyEnrolled.map(String)}`);
      await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
      // await this._checkoutRepo.updateOrder(orderId, { retryInProgress: false }, session);
      const names = await this._checkoutRepo.getCourseNamesByIds(alreadyEnrolled, session);
      throw new Error(`Payment cancelled: Already enrolled in ${names.join(", ")}`);
    }

    console.log(`Updating order ${orderId} status to PENDING`);
    await this._checkoutRepo.updateOrderStatus(orderId, "PENDING", session);

    console.log(`Updating order ${orderId} status to SUCCESS`);
    const updatedOrder = await this._checkoutRepo.updateOrderStatus(orderId, "SUCCESS", session);
    if (!updatedOrder) throw new Error("Order not found or could not be updated");

    console.log(`Saving payment for order ${orderId}`);
    const payment = await this._checkoutRepo.savePayment(
      {
        orderId,
        userId: updatedOrder.userId,
        paymentId,
        method,
        amount,
        status: "SUCCESS",
      },
      session
    );

    console.log(`Creating enrollments for order ${orderId}`);
    const enrollments = await this._checkoutRepo.createEnrollments(
      updatedOrder.userId,
      updatedOrder.courses,
      session
    );

    console.log(`Resetting retryInProgress for order ${orderId}`);
    // await this._checkoutRepo.updateOrder(orderId, { retryInProgress: false }, session);

    setImmediate(() => {
      this.processRevenueSharing(updatedOrder.courses, orderId.toString()).catch(console.error);
    });

    await this._cartRepo.clear(updatedOrder.userId);

    console.log(`Verification completed for order ${orderId}`);
    return { order: updatedOrder, payment, enrollments };
  } catch (error: any) {
    console.error(`Verification failed for order ${orderId}: ${error.message}`, error);
    throw error;
  }
}


  async cancelPendingOrder(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const order = await this._checkoutRepo.getOrderByIdWithLock(orderId, session);

        if (!order) {
          throw new Error("Order not found");
        }

        if (!order.userId.equals(userId)) {
          throw new Error("Unauthorized to cancel this order");
        }

        if (order.status !== "PENDING") {
          throw new Error("Only pending orders can be cancelled");
        }

        await this._checkoutRepo.updateOrderStatus(orderId, "CANCELLED", session);
      });
    } finally {
      await session.endSession();
    }
  }

  async markOrderAsFailed(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const order = await this._checkoutRepo.getOrderByIdWithLock(orderId, session);

        if (!order) {
          throw new Error("Order not found");
        }

        if (!order.userId.equals(userId)) {
          throw new Error("Unauthorized to mark this order as failed");
        }

        if (order.status !== "PENDING") {
          throw new Error("Only pending orders can be marked as failed");
        }

        await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
      });
    } finally {
      await session.endSession();
    }
  }

  async updateOrderStatus(
    orderId: Types.ObjectId,
    status: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING",
    userId?: Types.ObjectId
  ): Promise<IOrder | null> {
    const session = userId ? await mongoose.startSession() : undefined;

    try {
      if (session && userId) {
        return await session.withTransaction(async () => {
          const order = await this._checkoutRepo.getOrderByIdWithLock(orderId, session);
          if (!order) {
            throw new Error("Order not found");
          }
          if (!order.userId.equals(userId)) {
            throw new Error("Unauthorized to update this order");
          }
          return await this._checkoutRepo.updateOrderStatus(orderId, status, session);
        });
      }
      return await this._checkoutRepo.updateOrderStatus(orderId, status);
    } finally {
      if (session) await session.endSession();
    }
  }

  async updateOrder(
    orderId: Types.ObjectId,
    updates: Partial<IOrder>,
    userId?: Types.ObjectId,
    session?: mongoose.ClientSession
  ): Promise<IOrder | null> {
    if (session && userId) {
      const order = await this._checkoutRepo.getOrderByIdWithLock(orderId, session);
      if (!order) {
        throw new Error("Order not found");
      }
      if (!order.userId.equals(userId)) {
        throw new Error("Unauthorized to update this order");
      }
      return await this._checkoutRepo.updateOrder(orderId, updates, session);
    }

    const localSession = userId ? await mongoose.startSession() : undefined;
    try {
      if (localSession && userId) {
        return await localSession.withTransaction(async () => {
          const order = await this._checkoutRepo.getOrderByIdWithLock(orderId, localSession);
          if (!order) {
            throw new Error("Order not found");
          }
          if (!order.userId.equals(userId)) {
            throw new Error("Unauthorized to update this order");
          }
          return await this._checkoutRepo.updateOrder(orderId, updates, localSession);
        });
      }
      return await this._checkoutRepo.updateOrder(orderId, updates);
    } finally {
      if (localSession && !session) await localSession.endSession();
    }
  }

  private async processRevenueSharing(courseIds: Types.ObjectId[], txnId: string): Promise<void> {
    const courseRepo = this._checkoutRepo.getCourseRepo();

    for (const courseId of courseIds) {
      try {
        const course = await courseRepo.findById(courseId.toString());
        if (!course || !course.instructorId) continue;

        const instructorId = new Types.ObjectId(course.instructorId);
        const instructorShare = (course.price * 90) / 100;
        const adminShare = (course.price * 10) / 100;

        let instructorWallet = await this._walletService.getWallet(instructorId);
        if (!instructorWallet) {
          instructorWallet = await this._walletService.initializeWallet(
            instructorId,
            "Instructor",
            "instructor"
          );
        }

        await Promise.all([
          this._walletService.creditWallet(
            instructorId,
            instructorShare,
            `Revenue for ${course.courseName}`,
            txnId
          ),
          this._walletService.creditAdminWalletByEmail(
            process.env.ADMINEMAIL!,
            adminShare,
            `Admin share for ${course.courseName}`,
            txnId
          ),
        ]);
      } catch (error) {
        console.error(`Failed to process revenue sharing for course ${courseId}:`, error);
      }
    }
  }
}