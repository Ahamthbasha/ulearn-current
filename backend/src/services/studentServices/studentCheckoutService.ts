import { Types } from "mongoose";
import mongoose from "mongoose";
import { IStudentCheckoutService } from "./interface/IStudentCheckoutService";
import { IStudentCheckoutRepository } from "../../repositories/studentRepository/interface/IStudentCheckoutRepository";
import { IStudentCartRepository } from "../../repositories/studentRepository/interface/IStudentCartRepository";
import { IWalletService } from "../interface/IWalletService";
import { IStudentCouponRepo } from "../../repositories/studentRepository/interface/IStudentCouponRepo";
import { razorpay } from "../../utils/razorpay";
import {
  IOrder,
  ICourseOrderDetails,
  ILearningPathOrderDetails,
  ICouponDetails,
} from "../../models/orderModel";
import { IEnrollment } from "../../models/enrollmentModel";
import { IEnrollmentRepository } from "../../repositories/interfaces/IEnrollmentRepository";
import { ICourseRepository } from "../../repositories/interfaces/ICourseRepository";
import { ILearningPathRepository } from "../../repositories/interfaces/ILearningPathRepository";
import { appLogger } from "../../utils/logger";
import { BadRequestError, ConflictError, NotFoundError } from "../../utils/error";

export class StudentCheckoutService implements IStudentCheckoutService {
  private _checkoutRepo: IStudentCheckoutRepository;
  private _cartRepo: IStudentCartRepository;
  private _walletService: IWalletService;
  private _couponRepo: IStudentCouponRepo;
  private _enrollmentRepo: IEnrollmentRepository;

  constructor(
    checkoutRepo: IStudentCheckoutRepository,
    cartRepo: IStudentCartRepository,
    walletService: IWalletService,
    couponRepo: IStudentCouponRepo,
    enrollmentRepo: IEnrollmentRepository,
  ) {
    this._checkoutRepo = checkoutRepo;
    this._cartRepo = cartRepo;
    this._walletService = walletService;
    this._couponRepo = couponRepo;
    this._enrollmentRepo = enrollmentRepo;
  }

async initiateCheckout(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    learningPathIds: Types.ObjectId[] = [],
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
        const enrolledLearningPathIds =
          await this._checkoutRepo.getEnrolledLearningPathIds(userId, session);

        const alreadyEnrolledPaths = learningPathIds.filter((pid) =>
          enrolledLearningPathIds.some((eid) => eid.equals(pid)),
        );

        if (alreadyEnrolledPaths.length > 0) {
          const pathDetails =
            await this._checkoutRepo.getLearningPathNamesByIds(
              alreadyEnrolledPaths,
              session,
            );
          throw new BadRequestError(
            `Already enrolled in ${pathDetails.map((p) => p.name).join(", ")}.`,
          );
        }

        const learningPathCourseIds =
          await this._checkoutRepo.getAllCourseIdsFromLearningPaths(
            learningPathIds,
            session,
          );

        const overlappingCourseIds = courseIds.filter((courseId) =>
          learningPathCourseIds.some((lpCourseId) =>
            lpCourseId.equals(courseId),
          ),
        );

        if (overlappingCourseIds.length > 0) {
          const courseNames = await this._checkoutRepo.getCourseNamesByIds(
            overlappingCourseIds,
            session,
          );
          throw new BadRequestError(
            `Remove ${courseNames.join(", ")}, they are included in the learning path(s).`,
          );
        }

        const alreadyEnrolledIndividual = courseIds.filter((id) =>
          enrolledCourseIds.some((e) => e.equals(id)),
        );

        if (alreadyEnrolledIndividual.length > 0) {
          const names = await this._checkoutRepo.getCourseNamesByIds(
            alreadyEnrolledIndividual,
            session,
          );
          throw new BadRequestError(
            `Remove ${names.join(", ")} from cart, already enrolled.`,
          );
        }

        const allPurchasedCourseIds = [
          ...new Set([...courseIds, ...learningPathCourseIds]),
        ];

        await this._checkoutRepo.markStalePendingOrdersAsFailed(
          userId,
          allPurchasedCourseIds,
          session,
        );

        const existingOrder =
          await this._checkoutRepo.findPendingOrderWithOverlappingCourses(
            userId,
            allPurchasedCourseIds,
            session,
          );

        if (existingOrder) {
          const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
          if (existingOrder.createdAt > staleThreshold) {
            const error = new ConflictError(
              "A pending order already exists for these items. Please complete or cancel it first.",
            ) as ConflictError & { orderId?: string };
            error.orderId = existingOrder._id.toString();

            console.log("error object in initiate checkout",error)
            
            throw error;

          }
          await this._checkoutRepo.updateOrderStatus(
            existingOrder._id,
            "FAILED",
            session,
          );
        }

        const courseRepo = this._checkoutRepo.getCourseRepo();
        const learningPathRepo = this._checkoutRepo.getLearningPathRepo();

        const allCourseIds = [
          ...new Set([...courseIds, ...learningPathCourseIds]),
        ];
        const offerMap = await this._checkoutRepo.getValidCourseOffers(
          allCourseIds,
          session,
        );

        let individualCourses: ICourseOrderDetails[] = [];
        if (courseIds.length > 0) {
          individualCourses = await Promise.all(
            courseIds.map(async (courseId) => {
              const course = await courseRepo.findById(courseId.toString());
              if (!course) throw new NotFoundError(`Course ${courseId} not found`);
              if (!course.instructorId)
                throw new BadRequestError(
                  `Course ${courseId} has no instructor assigned`,
                );

              const offer = offerMap.get(courseId.toString());
              const offerPrice = offer
                ? Math.floor(
                    ((course.price * (100 - offer.discountPercentage)) / 100) *
                      100,
                  ) / 100
                : (course.effectivePrice ?? course.price);

              return {
                courseId,
                courseName: course.courseName,
                coursePrice: course.price,
                thumbnailUrl: course.thumbnailUrl,
                courseOfferPercentage: offer
                  ? offer.discountPercentage
                  : undefined,
                offerPrice,
                instructorId: new Types.ObjectId(course.instructorId),
                isAlreadyEnrolled: false,
              } as ICourseOrderDetails;
            }),
          );
        }

        let learningPathDetails: ILearningPathOrderDetails[] = [];
        if (learningPathIds.length > 0) {
          learningPathDetails = await Promise.all(
            learningPathIds.map(async (pathId) => {
              const path = await learningPathRepo.findById(pathId.toString());

              if (!path) throw new NotFoundError(`Learning path ${pathId} not found`);
              if (path.isPurchased) {
                throw new BadRequestError(
                  `Learning path ${path.title} already purchased`
                );
              }

              const pathCourses = await Promise.all(
                path.items
                  .sort((a, b) => a.order - b.order)
                  .map(async (item) => {
                    const course = await courseRepo.findById(
                      item.courseId.toString(),
                    );
                    if (!course)
                      throw new NotFoundError(`Course ${item.courseId} not found`);
                    if (!course.instructorId)
                      throw new BadRequestError(
                        `Course ${item.courseId} has no instructor assigned`,
                      );

                    const offer = offerMap.get(item.courseId.toString());
                    let offerPrice = offer
                      ? Math.floor(
                          ((course.price * (100 - offer.discountPercentage)) /
                            100) *
                            100,
                        ) / 100
                      : (course.effectivePrice ?? course.price);

                    const isAlreadyEnrolled = enrolledCourseIds.some((e) =>
                      e.equals(item.courseId as Types.ObjectId),
                    );
                    if (isAlreadyEnrolled) {
                      offerPrice = 0;
                    }

                    return {
                      courseId: item.courseId,
                      courseName: course.courseName,
                      coursePrice: course.price,
                      thumbnailUrl: course.thumbnailUrl,
                      courseOfferPercentage: offer
                        ? offer.discountPercentage
                        : undefined,
                      offerPrice,
                      instructorId: new Types.ObjectId(course.instructorId),
                      isAlreadyEnrolled,
                    } as ICourseOrderDetails;
                  }),
              );

              const totalPrice =
                Math.floor(
                  pathCourses.reduce(
                    (sum, course) =>
                      sum + (course.offerPrice ?? course.coursePrice),
                    0,
                  ) * 100,
                ) / 100;

              if (totalPrice === 0) {
                throw new BadRequestError(
                  `All courses in ${path.title} already enrolled, remove from cart.`,
                );
              }

              return {
                learningPathId: pathId,
                learningPathName: path.title,
                totalPrice,
                thumbnailUrl: path.thumbnailUrl || "",
                courses: pathCourses,
              } as ILearningPathOrderDetails;
            }),
          );
        }

        const allCoursesForPricing: ICourseOrderDetails[] = [
          ...individualCourses,
          ...learningPathDetails.flatMap((lp) => lp.courses),
        ];

        const originalTotalAmount =
          Math.floor(
            (individualCourses.reduce(
              (sum, course) => sum + (course.offerPrice ?? course.coursePrice),
              0,
            ) +
              learningPathDetails.reduce((sum, lp) => sum + lp.totalPrice, 0)) *
              100,
          ) / 100;

        let finalAmount = originalTotalAmount;
        let coupon: ICouponDetails | undefined;
        let perCourseDeduction = 0;

        if (couponId) {
          const appliedCoupon = await this._couponRepo.getCouponById(
            couponId,
            session,
          );
          if (!appliedCoupon) throw new NotFoundError("Invalid coupon");
          if (!appliedCoupon.status || appliedCoupon.expiryDate < new Date()) {
            throw new BadRequestError("Coupon is expired or inactive");
          }
          if (originalTotalAmount < appliedCoupon.minPurchase) {
            throw new BadRequestError(
              `Minimum purchase amount of ₹${appliedCoupon.minPurchase} required for this coupon`,
            );
          }
          if (appliedCoupon.usedBy.includes(userId)) {
            throw new BadRequestError("Coupon already used by this user");
          }
          const discountAmount =
            Math.floor(
              ((originalTotalAmount * appliedCoupon.discount) / 100) * 100,
            ) / 100;
          finalAmount = originalTotalAmount - discountAmount;
          if (
            appliedCoupon.maxDiscount &&
            finalAmount < originalTotalAmount - appliedCoupon.maxDiscount
          ) {
            finalAmount = originalTotalAmount - appliedCoupon.maxDiscount;
          }

          const totalDiscount = originalTotalAmount - finalAmount;
          perCourseDeduction =
            allCoursesForPricing.length > 0
              ? Math.floor(
                  (totalDiscount / allCoursesForPricing.length) * 100,
                ) / 100
              : 0;

          coupon = {
            couponId,
            couponName: appliedCoupon.code,
            discountPercentage: appliedCoupon.discount,
            discountAmount: totalDiscount,
          };
        }

        if (Math.abs(totalAmount - originalTotalAmount) > 0.01) {
          appLogger.warn(
            `Total amount mismatch: Frontend sent ${totalAmount}, calculated ${originalTotalAmount}`,
          );
        }

        let order: IOrder;
        if (paymentMethod === "wallet") {
          order = await this.processWalletPayment(
            userId,
            individualCourses,
            learningPathDetails,
            finalAmount,
            coupon,
            session,
            perCourseDeduction,
            allCoursesForPricing,
          );
        } else {
          order = await this.processRazorpayOrder(
            userId,
            individualCourses,
            learningPathDetails,
            finalAmount,
            coupon,
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
    individualCourses: ICourseOrderDetails[],
    learningPathDetails: ILearningPathOrderDetails[],
    totalAmount: number,
    coupon: ICouponDetails | undefined,
    session: mongoose.ClientSession,
    perCourseDeduction: number,
    allCoursesForPricing: ICourseOrderDetails[],
  ): Promise<IOrder> {
    const wallet = await this._walletService.getWallet(userId);
    if (!wallet || wallet.balance < totalAmount) {
      throw new Error("Insufficient wallet balance");
    }

    const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(
      userId,
      session,
    );

    const orderData: Partial<IOrder> = {
      userId,
      courses: individualCourses,
      learningPaths: learningPathDetails,
      amount: totalAmount,
      status: "PENDING",
      gateway: "wallet",
      gatewayOrderId: "wallet_txn_" + Date.now(),
      paymentId: "wallet_pay_" + Date.now(),
      paymentStatus: "SUCCESS",
      paymentMethod: "wallet",
      paymentAmount: totalAmount,
      paymentCreatedAt: new Date(),
      coupon,
    };

    const order = await this._checkoutRepo.createOrder(orderData, session);

    await this._walletService.debitWallet(
      userId,
      totalAmount,
      "Course/Learning Path Purchase",
      order._id.toString(),
    );

    await this._checkoutRepo.updateOrderStatus(order._id, "SUCCESS", session);

    const individualCourseIds = individualCourses.map(
      (course) => course.courseId,
    );
    await this._checkoutRepo.createEnrollments(
      individualCourseIds.map((courseId) => ({
        userId,
        courseId,
        completionStatus: "NOT_STARTED" as const,
        certificateGenerated: false,
        enrolledAt: new Date(),
      })),
      session,
    );

    for (const lp of learningPathDetails) {
      const existingEnrollments =
        await this._enrollmentRepo.findByUserAndCoursesWithSession(
          userId,
          lp.courses.map((c) => c.courseId),
          session,
        );

      for (const enrollment of existingEnrollments) {
        if (!enrollment.learningPathId) {
          await this._enrollmentRepo.updateEnrollmentWithSession(
            enrollment._id,
            { learningPathId: lp.learningPathId },
            session,
          );
        }
      }

      const newEnrollments = lp.courses
        .filter(
          (course) => !enrolledCourseIds.some((e) => e.equals(course.courseId)),
        )
        .map((course) => ({
          userId,
          courseId: course.courseId,
          learningPathId: lp.learningPathId,
          completionStatus: "NOT_STARTED" as const,
          certificateGenerated: false,
          enrolledAt: new Date(),
        }));

      await this._checkoutRepo.createEnrollments(newEnrollments, session);

      const completedCourses = await Promise.all(
        lp.courses.map(async (course) => {
          const enrollment = existingEnrollments.find((e: IEnrollment) =>
            e.courseId.equals(course.courseId),
          );
          return {
            courseId: course.courseId,
            isCompleted: enrollment?.completionStatus === "COMPLETED" || false,
            completedAt:
              enrollment?.completionStatus === "COMPLETED"
                ? enrollment.updatedAt
                : undefined,
          };
        }),
      );

      await this._checkoutRepo.createLearningPathEnrollments(
        [
          {
            userId,
            learningPathId: lp.learningPathId,
            enrolledAt: new Date(),
            completionStatus: "NOT_STARTED",
            certificateGenerated: false,
            unlockedOrder: 1,
            completedCourses,
          },
        ],
        session,
      );

      // Update isPurchased to true for the learning path
      await this._checkoutRepo.getLearningPathRepo().updateWithSession(
        lp.learningPathId.toString(),
        { isPurchased: true },
        session,
      );
    }

    if (coupon) {
      await this._couponRepo.addUserToCoupon(coupon.couponId, userId, session);
    }

    await this.processRevenueSharing(
      allCoursesForPricing,
      order._id.toString(),
      perCourseDeduction,
    );

    await this._cartRepo.clear(userId);
    return order;
  }

  private async processRazorpayOrder(
    userId: Types.ObjectId,
    individualCourses: ICourseOrderDetails[],
    learningPathDetails: ILearningPathOrderDetails[],
    totalAmount: number,
    coupon: ICouponDetails | undefined,
    session: mongoose.ClientSession,
  ): Promise<IOrder> {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.floor(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    });

    const orderData: Partial<IOrder> = {
      userId,
      courses: individualCourses,
      learningPaths: learningPathDetails,
      amount: totalAmount,
      status: "PENDING",
      gateway: "razorpay",
      gatewayOrderId: razorpayOrder.id,
      coupon,
    };

    return this._checkoutRepo.createOrder(orderData, session);
  }

  async verifyAndCompleteCheckout(
    orderId: Types.ObjectId,
    paymentId: string,
    method: string,
    amount: number,
    session?: mongoose.ClientSession,
  ): Promise<{
    order: IOrder;
    enrollments: IEnrollment[];
  }> {
    if (!session) {
      throw new Error("Session is required for verifyAndCompleteCheckout");
    }

    try {
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
        appLogger.error(
          `Amount mismatch: Expected ${order.amount}, received ${amount}`,
        );
        await this._checkoutRepo.updateOrderStatus(orderId, "FAILED", session);
        throw new Error("Payment amount mismatch");
      }

      const enrolledCourseIds = await this._checkoutRepo.getEnrolledCourseIds(
        order.userId,
        session,
      );
      await this._checkoutRepo.updateOrderStatus(orderId, "PENDING", session);

      const updatedOrder = await this._checkoutRepo.updateOrder(
        orderId,
        {
          status: "SUCCESS",
          paymentId,
          paymentStatus: "SUCCESS",
          paymentMethod: method,
          paymentAmount: amount,
          paymentCreatedAt: new Date(),
        },
        session,
      );
      if (!updatedOrder)
        throw new Error("Order not found or could not be updated");
      const individualEnrollments = await this._checkoutRepo.createEnrollments(
        updatedOrder.courses.map((course) => ({
          userId: updatedOrder.userId,
          courseId: course.courseId,
          completionStatus: "NOT_STARTED" as const,
          certificateGenerated: false,
          enrolledAt: new Date(),
        })),
        session,
      );

      const allEnrollments = [...individualEnrollments];

      for (const lp of updatedOrder.learningPaths) {
        const existingEnrollments =
          await this._enrollmentRepo.findByUserAndCoursesWithSession(
            updatedOrder.userId,
            lp.courses.map((c) => c.courseId),
            session,
          );

        for (const enrollment of existingEnrollments) {
          if (!enrollment.learningPathId) {
            await this._enrollmentRepo.updateEnrollmentWithSession(
              enrollment._id,
              { learningPathId: lp.learningPathId },
              session,
            );
          }
        }

        const newEnrollments = lp.courses
          .filter(
            (course) =>
              !enrolledCourseIds.some((e) => e.equals(course.courseId)),
          )
          .map((course) => ({
            userId: updatedOrder.userId,
            courseId: course.courseId,
            learningPathId: lp.learningPathId,
            completionStatus: "NOT_STARTED" as const,
            certificateGenerated: false,
            enrolledAt: new Date(),
          }));

        const pathCourseEnrollments =
          await this._checkoutRepo.createEnrollments(newEnrollments, session);
        allEnrollments.push(...pathCourseEnrollments);

        const completedCourses = await Promise.all(
          lp.courses.map(async (course) => {
            const enrollment = existingEnrollments.find((e: IEnrollment) =>
              e.courseId.equals(course.courseId),
            );
            return {
              courseId: course.courseId,
              isCompleted:
                enrollment?.completionStatus === "COMPLETED" || false,
              completedAt:
                enrollment?.completionStatus === "COMPLETED"
                  ? enrollment.updatedAt
                  : undefined,
            };
          }),
        );

        await this._checkoutRepo.createLearningPathEnrollments(
          [
            {
              userId: updatedOrder.userId,
              learningPathId: lp.learningPathId,
              enrolledAt: new Date(),
              completionStatus: "NOT_STARTED",
              certificateGenerated: false,
              unlockedOrder: 1,
              completedCourses,
            },
          ],
          session,
        );

        // Update isPurchased to true for the learning path
        await this._checkoutRepo.getLearningPathRepo().updateWithSession(
          lp.learningPathId.toString(),
          { isPurchased: true },
          session,
        );
      }

      if (updatedOrder.coupon) {
        await this._couponRepo.addUserToCoupon(
          updatedOrder.coupon.couponId,
          updatedOrder.userId,
          session,
        );
      }

      const perCourseDeduction = updatedOrder.coupon
        ? Math.floor(
            (updatedOrder.coupon.discountAmount /
              (updatedOrder.learningPaths.flatMap((lp) => lp.courses).length +
                updatedOrder.courses.length)) *
              100,
          ) / 100
        : 0;

      const allCourses = [
        ...updatedOrder.courses,
        ...updatedOrder.learningPaths.flatMap((lp) => lp.courses),
      ];

      await this.processRevenueSharing(
        allCourses,
        orderId.toString(),
        perCourseDeduction,
      );

      await this._cartRepo.clear(updatedOrder.userId);
      return { order: updatedOrder, enrollments: allEnrollments };
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      appLogger.error(
        `Verification failed for order ${orderId}: ${errorMessage}`,
        error,
      );
      throw error;
    }
  }

  private async processRevenueSharing(
    courses: ICourseOrderDetails[],
    txnId: string,
    perCourseDeduction: number = 0,
  ): Promise<void> {
    for (const course of courses) {
      try {
        if (
          !course.instructorId ||
          (course.offerPrice ?? course.coursePrice) === 0 ||
          course.isAlreadyEnrolled
        ) {
          appLogger.warn(
            `Skipping revenue sharing for course ${course.courseId}: no instructor, zero price, or already enrolled`,
          );
          continue;
        }

        const effectivePrice = course.offerPrice ?? course.coursePrice;
        const finalPrice =
          Math.floor((effectivePrice - perCourseDeduction) * 100) / 100;
        const instructorShare =
          Math.floor(((finalPrice * 90) / 100) * 100) / 100;
        const adminShare = finalPrice - instructorShare;

        let instructorWallet = await this._walletService.getWallet(
          course.instructorId,
        );
        if (!instructorWallet) {
          instructorWallet = await this._walletService.initializeWallet(
            course.instructorId,
            "Instructor",
            "instructor",
          );
        }

        await Promise.all([
          this._walletService.creditWallet(
            course.instructorId,
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
        appLogger.error(
          `Failed to process revenue sharing for course ${course.courseId}:`,
          error,
        );
      }
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
        if (!order) throw new Error("Order not found");
        if (!order.userId.equals(userId))
          throw new Error("Unauthorized to cancel this order");
        if (order.status !== "PENDING")
          throw new Error("Only pending orders can be cancelled");
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
        if (!order) throw new Error("Order not found");
        if (!order.userId.equals(userId))
          throw new Error("Unauthorized to mark this order as failed");
        if (order.status !== "PENDING")
          throw new Error("Only pending orders can be marked as failed");
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
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null> {
    const sessionLocal = userId ? await mongoose.startSession() : undefined;
    try {
      if (sessionLocal && userId) {
        return await sessionLocal.withTransaction(async () => {
          const order = await this._checkoutRepo.getOrderByIdWithLock(
            orderId,
            sessionLocal,
          );
          if (!order) throw new Error("Order not found");
          if (!order.userId.equals(userId))
            throw new Error("Unauthorized to update this order");
          return await this._checkoutRepo.updateOrderStatus(
            orderId,
            status,
            sessionLocal,
          );
        });
      }
      return await this._checkoutRepo.updateOrderStatus(
        orderId,
        status,
        session,
      );
    } finally {
      if (sessionLocal) await sessionLocal.endSession();
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
      if (!order) throw new Error("Order not found");
      if (!order.userId.equals(userId))
        throw new Error("Unauthorized to update this order");
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
          if (!order) throw new Error("Order not found");
          if (!order.userId.equals(userId))
            throw new Error("Unauthorized to update this order");
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

  async getEnrolledCourseIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]> {
    return this._checkoutRepo.getEnrolledCourseIds(userId, session);
  }

  async getEnrolledLearningPathIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]> {
    return this._checkoutRepo.getEnrolledLearningPathIds(userId, session);
  }

  getCourseRepo(): ICourseRepository {
    return this._checkoutRepo.getCourseRepo();
  }

  getLearningPathRepo(): ILearningPathRepository {
    return this._checkoutRepo.getLearningPathRepo();
  }
}