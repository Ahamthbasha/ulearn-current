import { Types } from "mongoose";
import mongoose from "mongoose";
import { IStudentOrderService } from "./interface/IStudentOrderService";
import { IStudentOrderRepository } from "../../repositories/studentRepository/interface/IStudentOrderRepository";
import { IStudentCheckoutService } from "../studentServices/interface/IStudentCheckoutService";
import { IOrder } from "../../models/orderModel";
import { OrderHistoryDTO } from "../../dto/userDTO/orderHistoryDTO";
import { OrderDetailsDTO } from "../../dto/userDTO/orderDetailsDTO";
import {
  mapCourses,
  mapCoupon,
  mapUserInfo,
  mapLearningPaths,
} from "../../mappers/userMapper/orderMapper";
import { razorpay } from "../../utils/razorpay";
import { StudentErrorMessages } from "../../utils/constants";
import { formatDate } from "../../utils/dateFormat";
import { appLogger } from "../../utils/logger";
import { UserDTO } from "../../dto/userDTO/courseInfoDTO";
import { BadRequestError, PaymentInProgressError } from "../../utils/error";

export class StudentOrderService implements IStudentOrderService {
  private _orderRepo: IStudentOrderRepository;
  private _checkoutService: IStudentCheckoutService;

  constructor(
    orderRepo: IStudentOrderRepository,
    checkoutService: IStudentCheckoutService,
  ) {
    this._orderRepo = orderRepo;
    this._checkoutService = checkoutService;
  }

  async getOrderHistoryPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ orders: OrderHistoryDTO[]; total: number }> {
    const { orders, total } = await this._orderRepo.getUserOrdersPaginated(
      userId,
      page,
      limit,
      search,
    );

    const orderDTOs: OrderHistoryDTO[] = orders.map((order) => ({
      orderId: order._id,
      orderDate: formatDate(new Date(order.createdAt)),
      finalPrice: order.amount,
      status: order.status,
    }));

    return { orders: orderDTOs, total };
  }

  async getOrderDetails(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<OrderDetailsDTO | null> {
    const order = await this._orderRepo.getOrderById(orderId, userId);
    if (!order) return null;

    // Map standalone courses
    const coursesInfo = await mapCourses(order.courses, true);

    // Map learning paths and their courses
    const learningPathsInfo = await mapLearningPaths(order.learningPaths, true);

    // Calculate totals for standalone courses, excluding already enrolled courses
    const sumOfStandaloneCourseOriginalPrice = coursesInfo.reduce(
      (sum, course) =>
        sum + (course.isAlreadyEnrolled ? 0 : course.courseOriginalPrice),
      0,
    );
    const sumOfStandaloneCourseOfferPrice = coursesInfo.reduce(
      (sum, course) =>
        sum + (course.isAlreadyEnrolled ? 0 : course.courseOfferPrice),
      0,
    );

    // Calculate totals for learning paths, summing prices of non-enrolled courses
    const sumOfLearningPathOriginalPrice = learningPathsInfo.reduce(
      (sum, learningPath) => {
        const learningPathOriginalPrice = learningPath.courses.reduce(
          (courseSum, course) =>
            courseSum +
            (course.isAlreadyEnrolled ? 0 : course.courseOriginalPrice),
          0,
        );
        return sum + learningPathOriginalPrice;
      },
      0,
    );
    const sumOfLearningPathOfferPrice = learningPathsInfo.reduce(
      (sum, learningPath) => {
        const learningPathOfferPrice = learningPath.courses.reduce(
          (courseSum, course) =>
            courseSum +
            (course.isAlreadyEnrolled ? 0 : course.courseOfferPrice),
          0,
        );
        return sum + learningPathOfferPrice;
      },
      0,
    );

    const sumOfAllCourseOriginalPrice =
      sumOfStandaloneCourseOriginalPrice + sumOfLearningPathOriginalPrice;
    const sumOfAllCourseIncludingOfferPrice =
      sumOfStandaloneCourseOfferPrice + sumOfLearningPathOfferPrice;

    const couponInfo = order.coupon ? mapCoupon(order.coupon) : undefined;

    return {
      orderId: order._id,
      userInfo: mapUserInfo(order.userId as unknown as UserDTO),
      coursesInfo,
      learningPathsInfo,
      couponInfo,
      sumOfAllCourseOriginalPrice,
      sumOfAllCourseIncludingOfferPrice,
      finalPrice: order.amount,
      status: order.status,
      orderDate: formatDate(new Date(order.createdAt)),
    };
  }

  async getOrderRaw(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<IOrder | null> {
    return await this._orderRepo.getOrderById(orderId, userId);
  }

  async retryPayment(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
    paymentData?: {
      paymentId: string;
      method: string;
      amount: number;
    },
    session?: mongoose.ClientSession,
  ): Promise<{
    success: boolean;
    message: string;
    paymentData?: {
      orderId: Types.ObjectId;
      amount: number;
      currency: string;
      razorpayOrderId: string;
      key: string;
    };
    order?: IOrder;
  }> {
    const localSession = session || (await mongoose.startSession());

    try {
      return await localSession.withTransaction(async () => {
        const order = await this._orderRepo.getOrderById(
          orderId,
          userId,
          localSession,
        );
        if (!order) {
          throw new Error(StudentErrorMessages.ORDER_NOT_FOUND);
        }

        // Check for enrolled courses
        const enrolledCourseIds =
          await this._checkoutService.getEnrolledCourseIds(
            userId,
            localSession,
          );
        const courseRepo = this._checkoutService.getCourseRepo();
        const enrolledCourses = order.courses.filter((course) =>
          enrolledCourseIds.some((eid) => eid.equals(course.courseId)),
        );
        const enrolledCourseNames = await Promise.all(
          enrolledCourses.map(async (course) => {
            const courseDetails = await courseRepo.findById(
              course.courseId.toString(),
            );
            return courseDetails
              ? courseDetails.courseName
              : course.courseId.toString();
          }),
        );

        // Check for enrolled learning paths
        const enrolledLearningPathIds =
          await this._checkoutService.getEnrolledLearningPathIds(
            userId,
            localSession,
          );
        const learningPathRepo = this._checkoutService.getLearningPathRepo();
        const enrolledLearningPaths = order.learningPaths.filter((lp) =>
          enrolledLearningPathIds.some((eid) => eid.equals(lp.learningPathId)),
        );
        const enrolledLearningPathNames = await Promise.all(
          enrolledLearningPaths.map(async (lp) => {
            const pathDetails = await learningPathRepo.findById(
              lp.learningPathId.toString(),
            );
            return pathDetails
              ? pathDetails.title
              : lp.learningPathId.toString();
          }),
        );

        if (enrolledCourses.length > 0 || enrolledLearningPaths.length > 0) {
          const enrolledItems = [
            ...enrolledCourseNames.map((name) => `Course: ${name}`),
            ...enrolledLearningPathNames.map(
              (name) => `Learning Path: ${name}`,
            ),
          ];
          throw new Error(
            `Cannot retry payment. Already enrolled in: ${enrolledItems.join(", ")}. Please remove these items and create a new order.`,
          );
        }

        if (
          paymentData?.paymentId &&
          paymentData?.method &&
          paymentData?.amount
        ) {
          try {
            const result =
              await this._checkoutService.verifyAndCompleteCheckout(
                orderId,
                paymentData.paymentId,
                paymentData.method,
                paymentData.amount,
                localSession,
              );
            return {
              success: true,
              message: "Payment retry successful",
              order: result.order,
            };
          } catch (verifyError) {
            const verifyErrorMessage = verifyError instanceof Error && verifyError.message
            await this._checkoutService.updateOrderStatus(
              orderId,
              "FAILED",
              userId,
              localSession,
            );
            throw new Error(
              verifyErrorMessage || "Payment verification failed",
            );
          }
        }

        if (order.status !== "FAILED") {
  if (order.status === "PENDING") {
    throw new PaymentInProgressError();
  }
  throw new BadRequestError("Only failed orders can be retried");
}

        try {
          const amountInPaise = Math.round(order.amount * 100);
          if (amountInPaise < 100) {
            throw new Error("Invalid order amount");
          }

          const receipt = `retry_${Date.now()}_${order._id.toString().slice(-8)}`;

          const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt,
            notes: {
              order_id: order._id.toString(),
              retry_attempt: "true",
            },
          });

          await this._checkoutService.updateOrder(
            orderId,
            {
              status: "PENDING",
              gatewayOrderId: razorpayOrder.id,
            },
            userId,
            localSession,
          );

          return {
            success: true,
            message: "Payment retry initiated",
            paymentData: {
              orderId: order._id,
              amount: order.amount,
              currency: "INR",
              razorpayOrderId: razorpayOrder.id,
              key: process.env.RAZORPAY_KEY_ID || "",
            },
          };
        } catch (razorpayError) {
          appLogger.error("Razorpay order creation failed:", razorpayError);
          throw new Error("Failed to create payment order. Please try again.");
        }
      });
    } finally {
      if (!session) await localSession.endSession();
    }
  }

  async markOrderAsFailed(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<{
    success: boolean;
    message: string;
    order?: IOrder;
  }> {
    const localSession = session || (await mongoose.startSession());

    try {
      return await localSession.withTransaction(async () => {
        const order = await this._orderRepo.getOrderById(
          orderId,
          userId,
          localSession,
        );
        if (!order) {
          throw new Error(StudentErrorMessages.ORDER_NOT_FOUND);
        }

        if (order.status !== "PENDING") {
          throw new Error("Only pending orders can be marked as failed");
        }

        await this._checkoutService.updateOrderStatus(
          orderId,
          "FAILED",
          userId,
          localSession,
        );

        const updatedOrder = await this._orderRepo.getOrderById(
          orderId,
          userId,
          localSession,
        );

        return {
          success: true,
          message: "Order marked as failed successfully",
          order: updatedOrder || undefined,
        };
      });
    } finally {
      if (!session) await localSession.endSession();
    }
  }
}
