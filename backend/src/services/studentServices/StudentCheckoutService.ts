import { IStudentCheckoutService } from "../interface/IStudentCheckoutService";
import { IStudentCheckoutRepository } from "../../repositories/interfaces/IStudentCheckoutRepository";
import { IStudentCartRepository } from "../../repositories/interfaces/IStudentCartRepository";
import { IWalletService } from "../interface/IWalletService";
import { razorpay } from "../../utils/razorpay";
import { Types } from "mongoose";
import { IOrder } from "../../models/orderModel";
import { IPayment } from "../../models/paymentModel";
import { IEnrollment } from "../../models/enrollmentModel";

export class StudentCheckoutService implements IStudentCheckoutService {
  constructor(
    private readonly checkoutRepo: IStudentCheckoutRepository,
    private readonly cartRepo: IStudentCartRepository,
    private readonly walletService: IWalletService
  ) {}

  async initiateCheckout(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    paymentMethod: "wallet" | "razorpay"
  ): Promise<IOrder> {
    const enrolledCourseIds = await this.checkoutRepo.getEnrolledCourseIds(userId);
    const alreadyEnrolled = courseIds.filter((cid) =>
      enrolledCourseIds.some((eid) => eid.equals(cid))
    );

    if (alreadyEnrolled.length > 0) {
      const names = await this.checkoutRepo.getCourseNamesByIds(alreadyEnrolled);
      throw new Error(`Remove ${names.join(", ")} from cart, already enrolled.`);
    }

    if (paymentMethod === "wallet") {
      const wallet = await this.walletService.getWallet(userId);
      if (!wallet || wallet.balance < totalAmount) {
        throw new Error("Insufficient wallet balance");
      }

      const order = await this.checkoutRepo.createOrder(
        userId,
        courseIds,
        totalAmount,
        "wallet_txn_" + Date.now()
      ) as IOrder;

      await this.walletService.debitWallet(userId, totalAmount, "Course Purchase", order._id.toString());
      await this.checkoutRepo.updateOrderStatus(order._id, "SUCCESS");

      await this.checkoutRepo.savePayment({
        orderId: order._id,
        userId,
        paymentId: order._id.toString(),
        method: "wallet",
        amount: totalAmount,
        status: "SUCCESS",
      });

      await this.checkoutRepo.createEnrollments(userId, courseIds);

      // ✅ Revenue split logic for wallet payments
      const courseRepo = this.checkoutRepo.getCourseRepo();
      const txnId = order._id.toString();

      for (const courseId of courseIds) {
        const course = await courseRepo.findById(courseId.toString());
        if (!course || !course.instructorId) continue;

        const instructorId = new Types.ObjectId(course.instructorId);
        const instructorShare = (course.price * 90) / 100;
        const adminShare = (course.price * 10) / 100;

        let instructorWallet = await this.walletService.getWallet(instructorId);
        if (!instructorWallet) {
          instructorWallet = await this.walletService.initializeWallet(
            instructorId,
            "Instructor",
            "instructor"
          );
        }

        await this.walletService.creditWallet(
          instructorId,
          instructorShare,
          `Revenue for ${course.courseName}`,
          txnId
        );

        await this.walletService.creditAdminWalletByEmail(
          process.env.ADMINEMAIL!,
          adminShare,
          `Admin share for ${course.courseName}`,
          txnId
        );
      }

      await this.cartRepo.clear(userId);

      return order;
    }

    // Razorpay flow
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    });

    return this.checkoutRepo.createOrder(userId, courseIds, totalAmount, razorpayOrder.id);
  }

  async verifyAndCompleteCheckout(
    orderId: Types.ObjectId,
    paymentId: string,
    method: string,
    amount: number
  ): Promise<{
    order: IOrder;
    payment: IPayment;
    enrollments: IEnrollment[];
  }> {
    const updatedOrder = await this.checkoutRepo.updateOrderStatus(orderId, "SUCCESS");
    if (!updatedOrder) throw new Error("Order not found or could not be updated");

    const payment = await this.checkoutRepo.savePayment({
      orderId,
      userId: updatedOrder.userId,
      paymentId,
      method,
      amount,
      status: "SUCCESS",
    });

    const enrollments = await this.checkoutRepo.createEnrollments(
      updatedOrder.userId,
      updatedOrder.courses
    );

    // 💸 Revenue split logic
    const courseRepo = this.checkoutRepo.getCourseRepo();
    const txnId = orderId.toString();

    for (const courseId of updatedOrder.courses) {
      const course = await courseRepo.findById(courseId.toString());
      if (!course || !course.instructorId) continue;

      const instructorId = new Types.ObjectId(course.instructorId);
      const instructorShare = (course.price * 90) / 100;
      const adminShare = (course.price * 10) / 100;

      let instructorWallet = await this.walletService.getWallet(instructorId);
      if (!instructorWallet) {
        instructorWallet = await this.walletService.initializeWallet(
          instructorId,
          "Instructor",
          "instructor"
        );
      }

      await this.walletService.creditWallet(
        instructorId,
        instructorShare,
        `Revenue for ${course.courseName}`,
        txnId
      );

      await this.walletService.creditAdminWalletByEmail(
        process.env.ADMINEMAIL!,
        adminShare,
        `Admin share for ${course.courseName}`,
        txnId
      );
    }

    await this.cartRepo.clear(updatedOrder.userId);

    return {
      order: updatedOrder,
      payment,
      enrollments,
    };
  }
}
