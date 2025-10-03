// import { IStudentCheckoutService } from "./interface/IStudentCheckoutService";
// import { IStudentCheckoutRepository } from "../../repositories/studentRepository/interface/IStudentCheckoutRepository";
// import { IStudentCartRepository } from "../../repositories/interfaces/IStudentCartRepository";
// import { IWalletService } from "../interface/IWalletService";
// import { IStudentCouponRepo } from "../../repositories/studentRepository/interface/IStudentCouponRepo";
// import { razorpay } from "../../utils/razorpay";
// import { Types } from "mongoose";
// import { IOrder } from "../../models/orderModel";
// import { IPayment } from "../../models/paymentModel";
// import { IEnrollment } from "../../models/enrollmentModel";
// import { ICoupon } from "../../models/couponModel";
// import mongoose from "mongoose";

// export class StudentCheckoutService implements IStudentCheckoutService {
//   private _checkoutRepo: IStudentCheckoutRepository;
//   private _cartRepo: IStudentCartRepository;
//   private _walletService: IWalletService;
//   private _couponRepo: IStudentCouponRepo;

//   constructor(
//     checkoutRepo: IStudentCheckoutRepository,
//     cartRepo: IStudentCartRepository,
//     walletService: IWalletService,
//     couponRepo: IStudentCouponRepo,
//   ) {
//     this._checkoutRepo = checkoutRepo;
//     this._cartRepo = cartRepo;
//     this._walletService = walletService;
//     this._couponRepo = couponRepo;
//   }

//   async initiateCheckout(
//     userId: Types.ObjectId,
//     courseIds: Types.ObjectId[],
//     totalAmount: number,
//     paymentMethod: "wallet" | "razorpay",
//     couponId?: Types.ObjectId,
//   ): Promise<IOrder> {
//     const session = await mongoose.startSession();

//     try {
//       return await session.withTransaction(async () => {
//         const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(
//           userId,
//           session,
//         );
//         const alreadyEnrolled = courseIds.filter((cid) =>
//           enrolledCourseIds.some((eid) => eid.equals(cid)),
//         );

//         if (alreadyEnrolled.length > 0) {
//           const names = await this._checkoutRepo.getCourseNamesByIds(
//             alreadyEnrolled,
//             session,
//           );
//           throw new Error(
//             `Remove ${names.join(", ")} from cart, already enrolled.`,
//           );
//         }

//         await this._checkoutRepo.markStalePendingOrdersAsFailed(
//           userId,
//           courseIds,
//           session,
//         );

//         const existingOrder =
//           await this._checkoutRepo.findPendingOrderForCourses(
//             userId,
//             courseIds,
//             session,
//           );

//         if (existingOrder) {
//           const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
//           if (existingOrder.createdAt > staleThreshold) {
//             const error = new Error(
//               "A pending order already exists for these courses. Please complete or cancel it first.",
//             );
//             (error as any).orderId = existingOrder._id.toString();
//             throw error;
//           }
//           await this._checkoutRepo.updateOrderStatus(
//             existingOrder._id,
//             "FAILED",
//             session,
//           );
//         }

//         const courseRepo = this._checkoutRepo.getCourseRepo();
//         const courses = await Promise.all(
//           courseIds.map((courseId) => courseRepo.findById(courseId.toString())),
//         );
//         const validCourses = courses.filter((course) => course !== null);
//         if (validCourses.length !== courseIds.length) {
//           throw new Error("One or more courses not found");
//         }

//         const originalTotalAmount = validCourses.reduce(
//           (sum, course) => sum + (course!.price || 0),
//           0,
//         );

//         let finalAmount = originalTotalAmount;
//         let appliedCoupon: ICoupon | null = null;
//         let perCourseDeduction = 0;

//         if (couponId) {
//           appliedCoupon = await this._couponRepo.getCouponById(couponId, session);
//           if (!appliedCoupon) {
//             throw new Error("Invalid coupon");
//           }
//           if (!appliedCoupon.status || appliedCoupon.expiryDate < new Date()) {
//             throw new Error("Coupon is expired or inactive");
//           }
//           if (originalTotalAmount < appliedCoupon.minPurchase) {
//             throw new Error(
//               `Minimum purchase amount of ₹${appliedCoupon.minPurchase} required for this coupon`,
//             );
//           }
//           if (appliedCoupon.usedBy.includes(userId)) {
//             throw new Error("Coupon already used by this user");
//           }
//           const discountAmount = (originalTotalAmount * appliedCoupon.discount) / 100;
//           finalAmount = originalTotalAmount - discountAmount;
//           if (appliedCoupon.maxDiscount && finalAmount < originalTotalAmount - appliedCoupon.maxDiscount) {
//             finalAmount = originalTotalAmount - appliedCoupon.maxDiscount;
//           }
          
//           const totalDiscount = originalTotalAmount - finalAmount;
//           perCourseDeduction = courseIds.length > 0 ? totalDiscount / courseIds.length : 0;
//         }

//         if (Math.abs(totalAmount - originalTotalAmount) > 0.01) {
//           console.warn(
//             `Total amount mismatch: Frontend sent ${totalAmount}, calculated ${originalTotalAmount}`,
//           );
//         }

//         let order: IOrder;
//         if (paymentMethod === "wallet") {
//           order = await this.processWalletPayment(
//             userId,
//             courseIds,
//             finalAmount,
//             couponId,
//             session,
//             perCourseDeduction,
//           );
//         } else {
//           order = await this.processRazorpayOrder(
//             userId,
//             courseIds,
//             finalAmount,
//             couponId,
//             session,
//           );
//         }

//         return order;
//       });
//     } finally {
//       await session.endSession();
//     }
//   }

//   private async processWalletPayment(
//     userId: Types.ObjectId,
//     courseIds: Types.ObjectId[],
//     totalAmount: number,
//     couponId: Types.ObjectId | undefined,
//     session: mongoose.ClientSession,
//     perCourseDeduction: number,
//   ): Promise<IOrder> {
//     const wallet = await this._walletService.getWallet(userId);
//     if (!wallet || wallet.balance < totalAmount) {
//       throw new Error("Insufficient wallet balance");
//     }

//     const order = await this._checkoutRepo.createOrder(
//       userId,
//       courseIds,
//       totalAmount,
//       "wallet_txn_" + Date.now(),
//       session,
//       couponId,
//     );

//     await this._walletService.debitWallet(
//       userId,
//       totalAmount,
//       "Course Purchase",
//       order._id.toString(),
//     );

//     await this._checkoutRepo.updateOrderStatus(order._id, "SUCCESS", session);

//     await this._checkoutRepo.savePayment(
//       {
//         orderId: order._id,
//         userId,
//         paymentId: order._id.toString(),
//         method: "wallet",
//         amount: totalAmount,
//         status: "SUCCESS",
//       },
//       session,
//     );

//     await this._checkoutRepo.createEnrollments(userId, courseIds, session);

//     if (couponId) {
//       await this._couponRepo.addUserToCoupon(couponId, userId, session);
//     }

//     // Process revenue sharing after successful wallet payment
//     await this.processRevenueSharing(courseIds, order._id.toString(), perCourseDeduction);

//     await this._cartRepo.clear(userId);
//     return order;
//   }

//   private async processRazorpayOrder(
//     userId: Types.ObjectId,
//     courseIds: Types.ObjectId[],
//     totalAmount: number,
//     couponId: Types.ObjectId | undefined,
//     session: mongoose.ClientSession,
//   ): Promise<IOrder> {
//     const razorpayOrder = await razorpay.orders.create({
//       amount: Math.round(totalAmount * 100),
//       currency: "INR",
//       receipt: `receipt_order_${Date.now()}`,
//     });

//     return this._checkoutRepo.createOrder(
//       userId,
//       courseIds,
//       totalAmount,
//       razorpayOrder.id,
//       session,
//       couponId,
//     );
//   }

//   async verifyAndCompleteCheckout(
//     orderId: Types.ObjectId,
//     paymentId: string,
//     method: string,
//     amount: number,
//     session: mongoose.ClientSession,
//   ): Promise<{
//     order: IOrder;
//     payment: IPayment;
//     enrollments: IEnrollment[];
//   }> {
//     try {
//       console.log(`Verifying payment for order ${orderId}, amount: ${amount}`);
//       const order = await this._checkoutRepo.getOrderByIdWithLock(
//         orderId,
//         session,
//       );

//       if (!order) {
//         throw new Error("Order not found");
//       }

//       if (order.status === "SUCCESS") {
//         throw new Error("Order already processed");
//       }

//       if (order.status !== "FAILED" && order.status !== "PENDING") {
//         throw new Error("Order cannot be processed");
//       }

//       if (Math.abs(order.amount - amount) > 0.01) {
//         console.error(
//           `Amount mismatch: Expected ${order.amount}, received ${amount}`,
//         );
//         await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
//         throw new Error("Payment amount mismatch");
//       }

//       const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(
//         order.userId,
//         session,
//       );

//       const alreadyEnrolled = order.courses.filter((courseId) =>
//         enrolledCourseIds.some((eid) => eid.equals(courseId)),
//       );

//       if (alreadyEnrolled.length > 0) {
//         console.warn(
//           `Already enrolled in courses: ${alreadyEnrolled.map(String)}`,
//         );
//         await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
//         const names = await this._checkoutRepo.getCourseNamesByIds(
//           alreadyEnrolled,
//           session,
//         );
//         throw new Error(
//           `Payment cancelled: Already enrolled in ${names.join(", ")}`,
//         );
//       }

//       console.log(`Updating order ${orderId} status to PENDING`);
//       await this._checkoutRepo.updateOrderStatus(orderId, "PENDING", session);

//       console.log(`Updating order ${orderId} status to SUCCESS`);
//       const updatedOrder = await this._checkoutRepo.updateOrderStatus(
//         orderId,
//         "SUCCESS",
//         session,
//       );
//       if (!updatedOrder)
//         throw new Error("Order not found or could not be updated");

//       console.log(`Saving payment for order ${orderId}`);
//       const payment = await this._checkoutRepo.savePayment(
//         {
//           orderId,
//           userId: updatedOrder.userId,
//           paymentId,
//           method,
//           amount,
//           status: "SUCCESS",
//         },
//         session,
//       );

//       console.log(`Creating enrollments for order ${orderId}`);
//       const enrollments = await this._checkoutRepo.createEnrollments(
//         updatedOrder.userId,
//         updatedOrder.courses,
//         session,
//       );

//       if (updatedOrder.couponId) {
//         await this._couponRepo.addUserToCoupon(updatedOrder.couponId, updatedOrder.userId, session);
//       }

      
//       let perCourseDeduction = 0;
//       if (updatedOrder.couponId) {
//         const coupon = await this._couponRepo.getCouponById(updatedOrder.couponId, session);
//         if (coupon) {
//           const courseRepo = this._checkoutRepo.getCourseRepo();
//           const courses = await Promise.all(
//             updatedOrder.courses.map((courseId) => courseRepo.findById(courseId.toString())),
//           );
//           const validCourses = courses.filter((course) => course !== null);
//           const originalTotalAmount = validCourses.reduce(
//             (sum, course) => sum + (course!.price || 0),
//             0,
//           );
//           const totalDiscount = originalTotalAmount - updatedOrder.amount;
//           perCourseDeduction = updatedOrder.courses.length > 0 ? totalDiscount / updatedOrder.courses.length : 0;
//         }
//       }

//       await this.processRevenueSharing(updatedOrder.courses, orderId.toString(), perCourseDeduction);

//       await this._cartRepo.clear(updatedOrder.userId);

//       console.log(`Verification completed for order ${orderId}`);
//       return { order: updatedOrder, payment, enrollments };
//     } catch (error: any) {
//       console.error(
//         `Verification failed for order ${orderId}: ${error.message}`,
//         error,
//       );
//       throw error;
//     }
//   }

//   async cancelPendingOrder(
//     orderId: Types.ObjectId,
//     userId: Types.ObjectId,
//   ): Promise<void> {
//     const session = await mongoose.startSession();

//     try {
//       await session.withTransaction(async () => {
//         const order = await this._checkoutRepo.getOrderByIdWithLock(
//           orderId,
//           session,
//         );

//         if (!order) {
//           throw new Error("Order not found");
//         }

//         if (!order.userId.equals(userId)) {
//           throw new Error("Unauthorized to cancel this order");
//         }

//         if (order.status !== "PENDING") {
//           throw new Error("Only pending orders can be cancelled");
//         }

//         await this._checkoutRepo.updateOrderStatus(
//           orderId,
//           "CANCELLED",
//           session,
//         );
//       });
//     } finally {
//       await session.endSession();
//     }
//   }

//   async markOrderAsFailed(
//     orderId: Types.ObjectId,
//     userId: Types.ObjectId,
//   ): Promise<void> {
//     const session = await mongoose.startSession();

//     try {
//       await session.withTransaction(async () => {
//         const order = await this._checkoutRepo.getOrderByIdWithLock(
//           orderId,
//           session,
//         );

//         if (!order) {
//           throw new Error("Order not found");
//         }

//         if (!order.userId.equals(userId)) {
//           throw new Error("Unauthorized to mark this order as failed");
//         }

//         if (order.status !== "PENDING") {
//           throw new Error("Only pending orders can be marked as failed");
//         }

//         await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
//       });
//     } finally {
//       await session.endSession();
//     }
//   }

//   async updateOrderStatus(
//     orderId: Types.ObjectId,
//     status: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING",
//     userId?: Types.ObjectId,
//   ): Promise<IOrder | null> {
//     const session = userId ? await mongoose.startSession() : undefined;

//     try {
//       if (session && userId) {
//         return await session.withTransaction(async () => {
//           const order = await this._checkoutRepo.getOrderByIdWithLock(
//             orderId,
//             session,
//           );
//           if (!order) {
//             throw new Error("Order not found");
//           }
//           if (!order.userId.equals(userId)) {
//             throw new Error("Unauthorized to update this order");
//           }
//           return await this._checkoutRepo.updateOrderStatus(
//             orderId,
//             status,
//             session,
//           );
//         });
//       }
//       return await this._checkoutRepo.updateOrderStatus(orderId, status);
//     } finally {
//       if (session) await session.endSession();
//     }
//   }

//   async updateOrder(
//     orderId: Types.ObjectId,
//     updates: Partial<IOrder>,
//     userId?: Types.ObjectId,
//     session?: mongoose.ClientSession,
//   ): Promise<IOrder | null> {
//     if (session && userId) {
//       const order = await this._checkoutRepo.getOrderByIdWithLock(
//         orderId,
//         session,
//       );
//       if (!order) {
//         throw new Error("Order not found");
//       }
//       if (!order.userId.equals(userId)) {
//         throw new Error("Unauthorized to update this order");
//       }
//       return await this._checkoutRepo.updateOrder(orderId, updates, session);
//     }

//     const localSession = userId ? await mongoose.startSession() : undefined;
//     try {
//       if (localSession && userId) {
//         return await localSession.withTransaction(async () => {
//           const order = await this._checkoutRepo.getOrderByIdWithLock(
//             orderId,
//             localSession,
//           );
//           if (!order) {
//             throw new Error("Order not found");
//           }
//           if (!order.userId.equals(userId)) {
//             throw new Error("Unauthorized to update this order");
//           }
//           return await this._checkoutRepo.updateOrder(
//             orderId,
//             updates,
//             localSession,
//           );
//         });
//       }
//       return await this._checkoutRepo.updateOrder(orderId, updates);
//     } finally {
//       if (localSession && !session) await localSession.endSession();
//     }
//   }

//   private async processRevenueSharing(
//     courseIds: Types.ObjectId[],
//     txnId: string,
//     perCourseDeduction: number = 0,
//   ): Promise<void> {
//     const courseRepo = this._checkoutRepo.getCourseRepo();

//     for (const courseId of courseIds) {
//       try {
//         const course = await courseRepo.findById(courseId.toString());
//         if (!course || !course.instructorId) continue;

//         const effectivePrice = course.price - perCourseDeduction;
//         const instructorShare = (effectivePrice * 90) / 100;
//         const adminShare = (effectivePrice * 10) / 100;

//         const instructorId = new Types.ObjectId(course.instructorId);
//         let instructorWallet = await this._walletService.getWallet(instructorId);
//         if (!instructorWallet) {
//           instructorWallet = await this._walletService.initializeWallet(
//             instructorId,
//             "Instructor",
//             "instructor",
//           );
//         }

//         await Promise.all([
//           this._walletService.creditWallet(
//             instructorId,
//             instructorShare,
//             `Revenue for ${course.courseName}`,
//             txnId,

//           ),
//           this._walletService.creditAdminWalletByEmail(
//             process.env.ADMINEMAIL!,
//             adminShare,
//             `Admin share for ${course.courseName}`,
//             txnId,
  
//           ),
//         ]);
//       } catch (error) {
//         console.error(
//           `Failed to process revenue sharing for course ${courseId}:`,
//           error,
//         );
//       }
//     }
//   }
// }











































































import { IStudentCheckoutService } from "./interface/IStudentCheckoutService";
import { IStudentCheckoutRepository } from "../../repositories/studentRepository/interface/IStudentCheckoutRepository";
import { IStudentCartRepository } from "../../repositories/interfaces/IStudentCartRepository";
import { IWalletService } from "../interface/IWalletService";
import { IStudentCouponRepo } from "../../repositories/studentRepository/interface/IStudentCouponRepo";
import { razorpay } from "../../utils/razorpay";
import { Types } from "mongoose";
import { IOrder } from "../../models/orderModel";
import { IPayment } from "../../models/paymentModel";
import { IEnrollment } from "../../models/enrollmentModel";
import { ICoupon } from "../../models/couponModel";
import mongoose from "mongoose";

export class StudentCheckoutService implements IStudentCheckoutService {
  private _checkoutRepo: IStudentCheckoutRepository;
  private _cartRepo: IStudentCartRepository;
  private _walletService: IWalletService;
  private _couponRepo: IStudentCouponRepo;

  constructor(
    checkoutRepo: IStudentCheckoutRepository,
    cartRepo: IStudentCartRepository,
    walletService: IWalletService,
    couponRepo: IStudentCouponRepo,
  ) {
    this._checkoutRepo = checkoutRepo;
    this._cartRepo = cartRepo;
    this._walletService = walletService;
    this._couponRepo = couponRepo;
  }

  async initiateCheckout(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    paymentMethod: "wallet" | "razorpay",
    couponId?: Types.ObjectId,
  ): Promise<IOrder> {
    const session = await mongoose.startSession();

    try {
      return await session.withTransaction(async () => {
        const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(
          userId,
          session,
        );
        const alreadyEnrolled = courseIds.filter((cid) =>
          enrolledCourseIds.some((eid) => eid.equals(cid)),
        );

        if (alreadyEnrolled.length > 0) {
          const names = await this._checkoutRepo.getCourseNamesByIds(
            alreadyEnrolled,
            session,
          );
          throw new Error(
            `Remove ${names.join(", ")} from cart, already enrolled.`,
          );
        }

        await this._checkoutRepo.markStalePendingOrdersAsFailed(
          userId,
          courseIds,
          session,
        );

        const existingOrder =
          await this._checkoutRepo.findPendingOrderForCourses(
            userId,
            courseIds,
            session,
          );

        if (existingOrder) {
          const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
          if (existingOrder.createdAt > staleThreshold) {
            const error = new Error(
              "A pending order already exists for these courses. Please complete or cancel it first.",
            );
            (error as any).orderId = existingOrder._id.toString();
            throw error;
          }
          await this._checkoutRepo.updateOrderStatus(
            existingOrder._id,
            "FAILED",
            session,
          );
        }

        const courseRepo = this._checkoutRepo.getCourseRepo();
        const courses = await Promise.all(
          courseIds.map(async (courseId) => {
            const course = await courseRepo.findById(courseId.toString());
            if (course && course.offer) {
              await course.populate("offer");
            }
            return course;
          }),
        );
        const validCourses = courses.filter((course) => course !== null);
        if (validCourses.length !== courseIds.length) {
          throw new Error("One or more courses not found");
        }

        const originalTotalAmount = validCourses.reduce(
          (sum, course) => sum + (course!.effectivePrice ?? course!.price),
          0,
        );

        let finalAmount = originalTotalAmount;
        let appliedCoupon: ICoupon | null = null;
        let perCourseDeduction = 0;

        if (couponId) {
          appliedCoupon = await this._couponRepo.getCouponById(couponId, session);
          if (!appliedCoupon) {
            throw new Error("Invalid coupon");
          }
          if (!appliedCoupon.status || appliedCoupon.expiryDate < new Date()) {
            throw new Error("Coupon is expired or inactive");
          }
          if (originalTotalAmount < appliedCoupon.minPurchase) {
            throw new Error(
              `Minimum purchase amount of ₹${appliedCoupon.minPurchase} required for this coupon`,
            );
          }
          if (appliedCoupon.usedBy.includes(userId)) {
            throw new Error("Coupon already used by this user");
          }
          const discountAmount = (originalTotalAmount * appliedCoupon.discount) / 100;
          finalAmount = originalTotalAmount - discountAmount;
          if (appliedCoupon.maxDiscount && finalAmount < originalTotalAmount - appliedCoupon.maxDiscount) {
            finalAmount = originalTotalAmount - appliedCoupon.maxDiscount;
          }

          const totalDiscount = originalTotalAmount - finalAmount;
          perCourseDeduction = courseIds.length > 0 ? totalDiscount / courseIds.length : 0;
        }

        if (Math.abs(totalAmount - originalTotalAmount) > 0.01) {
          console.warn(
            `Total amount mismatch: Frontend sent ${totalAmount}, calculated ${originalTotalAmount}`,
          );
        }

        let order: IOrder;
        if (paymentMethod === "wallet") {
          order = await this.processWalletPayment(
            userId,
            courseIds,
            finalAmount,
            couponId,
            session,
            perCourseDeduction,
          );
        } else {
          order = await this.processRazorpayOrder(
            userId,
            courseIds,
            finalAmount,
            couponId,
            session,
          );
        }

        return order;
      });
    } finally {
      await session.endSession();
    }
  }

  private async processWalletPayment(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    couponId: Types.ObjectId | undefined,
    session: mongoose.ClientSession,
    perCourseDeduction: number,
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
      session,
      couponId,
    );

    await this._walletService.debitWallet(
      userId,
      totalAmount,
      "Course Purchase",
      order._id.toString(),
    );

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
      session,
    );

    await this._checkoutRepo.createEnrollments(userId, courseIds, session);

    if (couponId) {
      await this._couponRepo.addUserToCoupon(couponId, userId, session);
    }

    // Process revenue sharing after successful wallet payment
    await this.processRevenueSharing(courseIds, order._id.toString(), perCourseDeduction);

    await this._cartRepo.clear(userId);
    return order;
  }

  private async processRazorpayOrder(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    totalAmount: number,
    couponId: Types.ObjectId | undefined,
    session: mongoose.ClientSession,
  ): Promise<IOrder> {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    });

    return this._checkoutRepo.createOrder(
      userId,
      courseIds,
      totalAmount,
      razorpayOrder.id,
      session,
      couponId,
    );
  }

  async verifyAndCompleteCheckout(
    orderId: Types.ObjectId,
    paymentId: string,
    method: string,
    amount: number,
    session: mongoose.ClientSession,
  ): Promise<{
    order: IOrder;
    payment: IPayment;
    enrollments: IEnrollment[];
  }> {
    try {
      console.log(`Verifying payment for order ${orderId}, amount: ${amount}`);
      const order = await this._checkoutRepo.getOrderByIdWithLock(
        orderId,
        session,
      );

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
        console.error(
          `Amount mismatch: Expected ${order.amount}, received ${amount}`,
        );
        await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
        throw new Error("Payment amount mismatch");
      }

      const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(
        order.userId,
        session,
      );

      const alreadyEnrolled = order.courses.filter((courseId) =>
        enrolledCourseIds.some((eid) => eid.equals(courseId)),
      );

      if (alreadyEnrolled.length > 0) {
        console.warn(
          `Already enrolled in courses: ${alreadyEnrolled.map(String)}`,
        );
        await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
        const names = await this._checkoutRepo.getCourseNamesByIds(
          alreadyEnrolled,
          session,
        );
        throw new Error(
          `Payment cancelled: Already enrolled in ${names.join(", ")}`,
        );
      }

      console.log(`Updating order ${orderId} status to PENDING`);
      await this._checkoutRepo.updateOrderStatus(orderId, "PENDING", session);

      console.log(`Updating order ${orderId} status to SUCCESS`);
      const updatedOrder = await this._checkoutRepo.updateOrderStatus(
        orderId,
        "SUCCESS",
        session,
      );
      if (!updatedOrder)
        throw new Error("Order not found or could not be updated");

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
        session,
      );

      console.log(`Creating enrollments for order ${orderId}`);
      const enrollments = await this._checkoutRepo.createEnrollments(
        updatedOrder.userId,
        updatedOrder.courses,
        session,
      );

      if (updatedOrder.couponId) {
        await this._couponRepo.addUserToCoupon(updatedOrder.couponId, updatedOrder.userId, session);
      }

      let perCourseDeduction = 0;
      if (updatedOrder.couponId) {
        const coupon = await this._couponRepo.getCouponById(updatedOrder.couponId, session);
        if (coupon) {
          const courseRepo = this._checkoutRepo.getCourseRepo();
          const courses = await Promise.all(
            updatedOrder.courses.map(async (courseId) => {
              const course = await courseRepo.findById(courseId.toString());
              if (course && course.offer) {
                await course.populate("offer");
              }
              return course;
            }),
          );
          const validCourses = courses.filter((course) => course !== null);
          const originalTotalAmount = validCourses.reduce(
            (sum, course) => sum + (course!.effectivePrice ?? course!.price),
            0,
          );
          const totalDiscount = originalTotalAmount - updatedOrder.amount;
          perCourseDeduction = updatedOrder.courses.length > 0 ? totalDiscount / updatedOrder.courses.length : 0;
        }
      }

      await this.processRevenueSharing(updatedOrder.courses, orderId.toString(), perCourseDeduction);

      await this._cartRepo.clear(updatedOrder.userId);

      console.log(`Verification completed for order ${orderId}`);
      return { order: updatedOrder, payment, enrollments };
    } catch (error: any) {
      console.error(
        `Verification failed for order ${orderId}: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  async cancelPendingOrder(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<void> {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const order = await this._checkoutRepo.getOrderByIdWithLock(
          orderId,
          session,
        );

        if (!order) {
          throw new Error("Order not found");
        }

        if (!order.userId.equals(userId)) {
          throw new Error("Unauthorized to cancel this order");
        }

        if (order.status !== "PENDING") {
          throw new Error("Only pending orders can be cancelled");
        }

        await this._checkoutRepo.updateOrderStatus(
          orderId,
          "CANCELLED",
          session,
        );
      });
    } finally {
      await session.endSession();
    }
  }

  async markOrderAsFailed(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<void> {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const order = await this._checkoutRepo.getOrderByIdWithLock(
          orderId,
          session,
        );

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
    userId?: Types.ObjectId,
  ): Promise<IOrder | null> {
    const session = userId ? await mongoose.startSession() : undefined;

    try {
      if (session && userId) {
        return await session.withTransaction(async () => {
          const order = await this._checkoutRepo.getOrderByIdWithLock(
            orderId,
            session,
          );
          if (!order) {
            throw new Error("Order not found");
          }
          if (!order.userId.equals(userId)) {
            throw new Error("Unauthorized to update this order");
          }
          return await this._checkoutRepo.updateOrderStatus(
            orderId,
            status,
            session,
          );
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
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null> {
    if (session && userId) {
      const order = await this._checkoutRepo.getOrderByIdWithLock(
        orderId,
        session,
      );
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
          const order = await this._checkoutRepo.getOrderByIdWithLock(
            orderId,
            localSession,
          );
          if (!order) {
            throw new Error("Order not found");
          }
          if (!order.userId.equals(userId)) {
            throw new Error("Unauthorized to update this order");
          }
          return await this._checkoutRepo.updateOrder(
            orderId,
            updates,
            localSession,
          );
        });
      }
      return await this._checkoutRepo.updateOrder(orderId, updates);
    } finally {
      if (localSession && !session) await localSession.endSession();
    }
  }

  private async processRevenueSharing(
    courseIds: Types.ObjectId[],
    txnId: string,
    perCourseDeduction: number = 0,
  ): Promise<void> {
    const courseRepo = this._checkoutRepo.getCourseRepo();

    for (const courseId of courseIds) {
      try {
        const course = await courseRepo.findById(courseId.toString());
        if (!course || !course.instructorId) continue;

        if (course.offer) {
          await course.populate("offer");
        }

        const effectivePrice = course.effectivePrice ?? course.price;
        const finalPrice = effectivePrice - perCourseDeduction;
        const instructorShare = (finalPrice * 90) / 100;
        const adminShare = (finalPrice * 10) / 100;

        const instructorId = new Types.ObjectId(course.instructorId);
        let instructorWallet = await this._walletService.getWallet(instructorId);
        if (!instructorWallet) {
          instructorWallet = await this._walletService.initializeWallet(
            instructorId,
            "Instructor",
            "instructor",
          );
        }

        await Promise.all([
          this._walletService.creditWallet(
            instructorId,
            instructorShare,
            `Revenue for ${course.courseName}`,
            txnId,
          ),
          this._walletService.creditAdminWalletByEmail(
            process.env.ADMINEMAIL!,
            adminShare,
            `Admin share for ${course.courseName}`,
            txnId,
          ),
        ]);
      } catch (error) {
        console.error(
          `Failed to process revenue sharing for course ${courseId}:`,
          error,
        );
      }
    }
  }
}