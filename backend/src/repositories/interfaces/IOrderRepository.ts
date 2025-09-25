import { IGenericRepository } from "../genericRepository";
import { IOrder } from "../../models/orderModel";
import { ClientSession } from "mongoose";

export interface IOrderRepository extends IGenericRepository<IOrder> {
  findPendingOrdersByUser(userId: string): Promise<IOrder[]>;
  findOrdersByStatus(status: string): Promise<IOrder[]>;
  updateMany(filter: object, data: Partial<IOrder>): Promise<void>;
  updateManyWithSession(
    filter: object,
    data: Partial<IOrder>,
    session: ClientSession,
  ): Promise<void>;
}
