import { Types } from "mongoose";
import { IStudentOrderService } from "../interface/IStudentOrderService";
import { IStudentOrderRepository } from "../../repositories/interfaces/IStudentOrderRepository";
import { IOrder } from "../../models/orderModel";

export class StudentOrderService implements IStudentOrderService {
  constructor(private orderRepo: IStudentOrderRepository) {}

  async getOrderHistoryPaginated(userId: Types.ObjectId, page: number, limit: number): Promise<{ orders: IOrder[]; total: number }> {
    return this.orderRepo.getUserOrdersPaginated(userId, page, limit);
  }

  async getOrderDetails(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<IOrder | null> {
    return this.orderRepo.getOrderById(orderId, userId);
  }
}
