import { Types } from "mongoose";
import { IOrder } from "../../../models/orderModel";
import { OrderHistoryDTO } from "../../../dto/userDTO/orderHistoryDTO";
import { OrderDetailsDTO } from "../../../dto/userDTO/orderDetailsDTO";
import mongoose from "mongoose";

export interface IStudentOrderService {
  getOrderHistoryPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{
    orders: OrderHistoryDTO[];
    total: number;
  }>;

  getOrderDetails(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<OrderDetailsDTO | null>;

  getOrderRaw(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<IOrder | null>;

  retryPayment(
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
  }>;

  markOrderAsFailed(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<{
    success: boolean;
    message: string;
    order?: IOrder;
  }>;
}
