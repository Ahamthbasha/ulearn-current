import { Types } from "mongoose";
import mongoose from "mongoose";
import { IStudentOrderService } from "./interface/IStudentOrderService";
import { IStudentOrderRepository } from "../../repositories/studentRepository/interface/IStudentOrderRepository";
import { IStudentCheckoutService } from "../studentServices/interface/IStudentCheckoutService";
import { IOrder } from "../../models/orderModel";
import { OrderHistoryDTO } from "../../dto/userDTO/orderHistoryDTO";
import { OrderDetailsDTO } from "../../dto/userDTO/orderDetailsDTO";
import { toOrderHistoryDTO } from "../../mappers/userMapper/orderHistoryMapper";
import { toOrderDetailsDTO } from "../../mappers/userMapper/orderDetailMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { razorpay } from "../../utils/razorpay";
import { StudentErrorMessages } from "../../utils/constants";

export class StudentOrderService implements IStudentOrderService {
  private _orderRepo: IStudentOrderRepository;
  private _checkoutService: IStudentCheckoutService;

  constructor(
    orderRepo: IStudentOrderRepository,
    checkoutService: IStudentCheckoutService
  ) {
    this._orderRepo = orderRepo;
    this._checkoutService = checkoutService;
  }

  async getOrderHistoryPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ orders: OrderHistoryDTO[]; total: number }> {
    const { orders, total } = await this._orderRepo.getUserOrdersPaginated(
      userId,
      page,
      limit,
      search
    );

    const orderDTOs = orders.map((order) => ({
      ...toOrderHistoryDTO(order),
      canRetryPayment: order.status === "FAILED",
    }));

    return { orders: orderDTOs, total };
  }

  async getOrderDetails(
    orderId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<OrderDetailsDTO | null> {
    const order = await this._orderRepo.getOrderById(orderId, userId);
    if (!order) return null;

    const coursesWithSignedUrls = await Promise.all(
      order.courses.map(async (course: any) => {
        const signedUrl = await getPresignedUrl(course.thumbnailUrl);
        return { ...course.toObject?.(), thumbnailUrl: signedUrl };
      })
    );

    const orderWithSignedUrls = {
      ...order.toObject?.(),
      courses: coursesWithSignedUrls,
    };

    return {
      ...toOrderDetailsDTO(orderWithSignedUrls),
      canRetryPayment: order.status === "FAILED",
      retryInProgress: order.retryInProgress || false,
    };
  }

  async getOrderRaw(
    orderId: Types.ObjectId,
    userId: Types.ObjectId
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
    retryAttemptId?: string;
  },
  session?: mongoose.ClientSession
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
  const localSession = session || await mongoose.startSession();

  try {
    return await localSession.withTransaction(async () => {
      const order = await this._orderRepo.getOrderById(orderId, userId, localSession);
      if (!order) {
        throw new Error(StudentErrorMessages.ORDER_NOT_FOUND);
      }

      if (order.status !== "FAILED") {
        throw new Error("Only failed orders can be retried");
      }

      const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
      if (order.retryInProgress && order.updatedAt < staleThreshold) {
        await this._checkoutService.updateOrder(
          orderId,
          { retryInProgress: false },
          userId,
          localSession
        );
      }

      const updatedOrder = await this._orderRepo.getOrderById(orderId, userId, localSession);
      if (!updatedOrder) {
        throw new Error("Failed to fetch updated order");
      }

      console.log(`retryInProgress state: ${updatedOrder.retryInProgress}, paymentData: ${!!paymentData}`);

      if (paymentData?.paymentId && paymentData?.method && paymentData?.amount) {
        try {
          const result = await this._checkoutService.verifyAndCompleteCheckout(
            orderId,
            paymentData.paymentId,
            paymentData.method,
            paymentData.amount,
            localSession // Pass the existing session
          );
          await this._checkoutService.updateOrder(
            orderId,
            { retryInProgress: false },
            userId,
            localSession
          );
          return {
            success: true,
            message: "Payment retry successful",
            order: result.order,
          };
        } catch (verifyError: any) {
          await this._checkoutService.updateOrder(
            orderId,
            { retryInProgress: false },
            userId,
            localSession
          );
          await this._checkoutService.updateOrderStatus(
            orderId,
            "FAILED",
            userId,
            localSession
          );
          throw new Error(verifyError.message || "Payment verification failed");
        }
      }

      if (updatedOrder.retryInProgress) {
        throw new Error("A payment retry is already in progress for this order");
      }

      const retryOrder = await this._checkoutService.updateOrder(
        orderId,
        { retryInProgress: true },
        userId,
        localSession
      );

      if (!retryOrder) {
        throw new Error("Failed to update order");
      }

      try {
        const amountInPaise = Math.round(updatedOrder.amount * 100);
        if (amountInPaise < 100) {
          throw new Error("Invalid order amount");
        }

        const receipt = `retry_${Date.now()}_${order._id.toString().slice(-8)}`;

        const razorpayOrder = await razorpay.orders.create({ // Await the promise
          amount: amountInPaise,
          currency: "INR",
          receipt,
          notes: {
            order_id: order._id.toString(),
            retry_attempt: "true",
            retryAttemptId: paymentData?.retryAttemptId ?? null, // Default to null if undefined
          },
        });

        await this._checkoutService.updateOrder(
          orderId,
          { gatewayOrderId: razorpayOrder.id },
          userId,
          localSession
        );

        return {
          success: true,
          message: "Payment retry initiated",
          paymentData: {
            orderId: order._id,
            amount: updatedOrder.amount,
            currency: "INR",
            razorpayOrderId: razorpayOrder.id,
            key: process.env.RAZORPAY_KEY_ID || "",
          },
        };
      } catch (razorpayError: any) {
        await this._checkoutService.updateOrder(
          orderId,
          { retryInProgress: false },
          userId,
          localSession
        );
        console.error("Razorpay order creation failed:", razorpayError);
        throw new Error("Failed to create payment order. Please try again.");
      }
    });
  } finally {
    if (!session) await localSession.endSession();
  }
}

}