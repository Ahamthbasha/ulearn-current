import { IOrder, OrderModel } from "../models/orderModel";
import { IOrderRepository } from "./interfaces/IOrderRepository";
import { GenericRepository } from "./genericRepository";
import { ClientSession, PipelineStage } from "mongoose";
import { Types } from "mongoose";
export class OrderRepository
  extends GenericRepository<IOrder>
  implements IOrderRepository
{
  constructor() {
    super(OrderModel);
  }

  async findPendingOrdersByUser(userId: string): Promise<IOrder[]> {
    return this.model.find({ userId, status: "PENDING" }).exec();
  }

  async findOrdersByStatus(status: string): Promise<IOrder[]> {
    return this.model.find({ status }).exec();
  }

  async updateMany(filter: object, data: Partial<IOrder>): Promise<void> {
    await this.model.updateMany(filter, data).exec();
  }

  async updateManyWithSession(
    filter: object,
    data: Partial<IOrder>,
    session: ClientSession,
  ): Promise<void> {
    await this.model.updateMany(filter, data, { session }).exec();
  }

  async findSuccessfulOrdersLean(): Promise<IOrder[]> {
    return this.model.find({ status: "SUCCESS" }).lean().exec();
  }

  async performAggregation<T>(pipeline: PipelineStage[]): Promise<T[]> {
    return this.model.aggregate<T>(pipeline).exec();
  }

  async countDocumentsMatching(query: object): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  async findByUserAndLearningPath(
    userId: Types.ObjectId,
    learningPathId: Types.ObjectId,
  ): Promise<IOrder | null> {
    try {
      return await this.model
        .findOne({
          userId,
          "learningPaths.learningPathId": learningPathId,
          status: "SUCCESS",
        })
        .lean()
        .exec();
    } catch (error) {
      throw new Error(
        `Failed to find order by user and learning path: ${(error as Error).message}`,
      );
    }
  }

  async findByUser(userId: Types.ObjectId): Promise<IOrder[]> {
    try {
      return await this.model
        .find({
          userId,
          status: "SUCCESS",
        })
        .lean()
        .exec();
    } catch (error) {
      throw new Error(
        `Failed to find orders by user: ${(error as Error).message}`,
      );
    }
  }
}
