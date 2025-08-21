import { Types } from "mongoose";
import { IOrder } from "../../../models/orderModel";

export interface IStudentOrderRepository {
  getUserOrdersPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ orders: IOrder[]; total: number }>;
  getOrderById(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<IOrder | null>;
}
