import { Types } from "mongoose";
import mongoose from "mongoose";
import { IStudentOrderService } from "./interface/IStudentOrderService";
import { IStudentOrderRepository } from "../../repositories/studentRepository/interface/IStudentOrderRepository";
import { IStudentCheckoutService } from "../studentServices/interface/IStudentCheckoutService";
import { IOrder } from "../../models/orderModel";
import { OrderHistoryDTO } from "../../dto/userDTO/orderHistoryDTO";
import { OrderDetailsDTO } from "../../dto/userDTO/orderDetailsDTO";
import { mapCourses, mapCoupon, mapUserInfo } from "../../mappers/userMapper/orderMapper";
import { razorpay } from "../../utils/razorpay";
import { StudentErrorMessages } from "../../utils/constants";
import { formatDate } from "../../utils/dateFormat";

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

    const coursesInfo = await mapCourses(order.courses, true);
    const sumOfAllCourseOriginalPrice = coursesInfo.reduce((sum, course) => sum + course.courseOriginalPrice, 0);
    const sumOfAllCourseIncludingOfferPrice = coursesInfo.reduce((sum, course) => sum + course.courseOfferPrice, 0);
    const couponInfo = order.coupon ? mapCoupon(order.coupon) : undefined;

    return {
      orderId: order._id,
      userInfo: mapUserInfo(order.userId),
      coursesInfo,
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
          } catch (verifyError: any) {
            await this._checkoutService.updateOrderStatus(
              orderId,
              "FAILED",
              userId,
              localSession,
            );
            throw new Error(
              verifyError.message || "Payment verification failed",
            );
          }
        }

        if (order.status !== "FAILED") {
          throw new Error("Only failed orders can be retried");
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
        } catch (razorpayError: any) {
          console.error("Razorpay order creation failed:", razorpayError);
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

