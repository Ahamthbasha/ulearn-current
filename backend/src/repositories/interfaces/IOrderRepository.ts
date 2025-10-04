import { IGenericRepository } from "../genericRepository";
import { IOrder } from "../../models/orderModel";
import { ClientSession, PipelineStage } from "mongoose";

export interface IOrderRepository extends IGenericRepository<IOrder> {
  findPendingOrdersByUser(userId: string): Promise<IOrder[]>;
  findOrdersByStatus(status: string): Promise<IOrder[]>;
  updateMany(filter: object, data: Partial<IOrder>): Promise<void>;
  updateManyWithSession(
    filter: object,
    data: Partial<IOrder>,
    session: ClientSession,
  ): Promise<void>;
  findSuccessfulOrdersLean(): Promise<IOrder[]>;
  performAggregation<T = any>(pipeline: PipelineStage[]): Promise<T[]>;
  countDocumentsMatching(query: object): Promise<number>;
}