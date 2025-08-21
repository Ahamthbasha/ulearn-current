import { IStudentCheckoutService } from "./interface/IStudentCheckoutService";
import { IStudentCheckoutRepository } from "../../repositories/studentRepository/interface/IStudentCheckoutRepository";
import { IStudentCartRepository } from "../../repositories/interfaces/IStudentCartRepository";
import { IWalletService } from "../interface/IWalletService";
import { razorpay } from "../../utils/razorpay";
import { Types } from "mongoose";
import { IOrder } from "../../models/orderModel";
import { IPayment } from "../../models/paymentModel";
import { IEnrollment } from "../../models/enrollmentModel";

export class StudentCheckoutService implements IStudentCheckoutService {
  private _checkoutRepo: IStudentCheckoutRepository;
  private _cartRepo: IStudentCartRepository;
  private _walletService: IWalletService;
  constructor(
    checkoutRepo: IStudentCheckoutRepository,
    cartRepo: IStudentCartRepository,
    walletService: IWalletService,
  ) {
    this._checkoutRepo = checkoutRepo;
    this._cartRepo = cartRepo;
    this._walletService = walletService;
  }

  async initiateCheckout(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    paymentMethod: "wallet" | "razorpay",
  ): Promise<IOrder> {
    const enrolledCourseIds =
      await this._checkoutRepo.getEnrolledCourseIds(userId);
    const alreadyEnrolled = courseIds.filter((cid) =>
      enrolledCourseIds.some((eid) => eid.equals(cid)),
    );

    if (alreadyEnrolled.length > 0) {
      const names =
        await this._checkoutRepo.getCourseNamesByIds(alreadyEnrolled);
      throw new Error(
        `Remove ${names.join(", ")} from cart, already enrolled.`,
      );
    }

    if (paymentMethod === "wallet") {
      const wallet = await this._walletService.getWallet(userId);
      if (!wallet || wallet.balance < totalAmount) {
        throw new Error("Insufficient wallet balance");
      }

      const order = (await this._checkoutRepo.createOrder(
        userId,
        courseIds,
        totalAmount,
        "wallet_txn_" + Date.now(),
      )) as IOrder;

      await this._walletService.debitWallet(
        userId,
        totalAmount,
        "Course Purchase",
        order._id.toString(),
      );
      await this._checkoutRepo.updateOrderStatus(order._id, "SUCCESS");

      await this._checkoutRepo.savePayment({
        orderId: order._id,
        userId,
        paymentId: order._id.toString(),
        method: "wallet",
        amount: totalAmount,
        status: "SUCCESS",
      });

      await this._checkoutRepo.createEnrollments(userId, courseIds);

      // ✅ Revenue split logic for wallet payments
      const courseRepo = this._checkoutRepo.getCourseRepo();
      const txnId = order._id.toString();

      for (const courseId of courseIds) {
        const course = await courseRepo.findById(courseId.toString());
        if (!course || !course.instructorId) continue;

        const instructorId = new Types.ObjectId(course.instructorId);
        const instructorShare = (course.price * 90) / 100;
        const adminShare = (course.price * 10) / 100;

        let instructorWallet =
          await this._walletService.getWallet(instructorId);
        if (!instructorWallet) {
          instructorWallet = await this._walletService.initializeWallet(
            instructorId,
            "Instructor",
            "instructor",
          );
        }

        await this._walletService.creditWallet(
          instructorId,
          instructorShare,
          `Revenue for ${course.courseName}`,
          txnId,
        );

        await this._walletService.creditAdminWalletByEmail(
          process.env.ADMINEMAIL!,
          adminShare,
          `Admin share for ${course.courseName}`,
          txnId,
        );
      }

      await this._cartRepo.clear(userId);

      return order;
    }

    // Razorpay flow
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    });

    return this._checkoutRepo.createOrder(
      userId,
      courseIds,
      totalAmount,
      razorpayOrder.id,
    );
  }

  async verifyAndCompleteCheckout(
    orderId: Types.ObjectId,
    paymentId: string,
    method: string,
    amount: number,
  ): Promise<{
    order: IOrder;
    payment: IPayment;
    enrollments: IEnrollment[];
  }> {
    const order = await this._checkoutRepo.getOrderById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // 🚫 Prevent double payment
    if (order.status === "SUCCESS") {
      throw new Error("Order already processed");
    }
    if (order.status === "FAILED") {
      throw new Error("Order failed earlier, please create a new order");
    }

    // ✅ NEW: Check if user is already enrolled (prevent double enrollment)
    const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(
      order.userId,
    );
    const alreadyEnrolled = order.courses.filter((courseId) =>
      enrolledCourseIds.some((eid) => eid.equals(courseId)),
    );

    if (alreadyEnrolled.length > 0) {
      // Mark order as failed and don't process payment
      await this._checkoutRepo.updateOrderStatus(orderId, "FAILED");
      const names =
        await this._checkoutRepo.getCourseNamesByIds(alreadyEnrolled);
      throw new Error(
        `Payment cancelled: Already enrolled in ${names.join(", ")}`,
      );
    }

    // ✅ Now proceed with payment verification
    const updatedOrder = await this._checkoutRepo.updateOrderStatus(
      orderId,
      "SUCCESS",
    );
    if (!updatedOrder)
      throw new Error("Order not found or could not be updated");

    const payment = await this._checkoutRepo.savePayment({
      orderId,
      userId: updatedOrder.userId,
      paymentId,
      method,
      amount,
      status: "SUCCESS",
    });

    const enrollments = await this._checkoutRepo.createEnrollments(
      updatedOrder.userId,
      updatedOrder.courses,
    );

    // Revenue split logic remains the same...
    const courseRepo = this._checkoutRepo.getCourseRepo();
    const txnId = orderId.toString();

    for (const courseId of updatedOrder.courses) {
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
          "instructor",
        );
      }

      await this._walletService.creditWallet(
        instructorId,
        instructorShare,
        `Revenue for ${course.courseName}`,
        txnId,
      );

      await this._walletService.creditAdminWalletByEmail(
        process.env.ADMINEMAIL!,
        adminShare,
        `Admin share for ${course.courseName}`,
        txnId,
      );
    }

    await this._cartRepo.clear(updatedOrder.userId);
    return { order: updatedOrder, payment, enrollments };
  }
}
