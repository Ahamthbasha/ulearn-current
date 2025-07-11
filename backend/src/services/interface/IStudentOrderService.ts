import { Types } from "mongoose";
import { IOrder } from "../../models/orderModel";

export interface IStudentOrderService {
  getOrderHistoryPaginated(userId: Types.ObjectId, page: number, limit: number): Promise<{ orders: IOrder[]; total: number }>;
  getOrderDetails(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<IOrder | null>;
}
