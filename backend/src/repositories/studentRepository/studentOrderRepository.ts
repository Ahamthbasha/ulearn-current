import { Types, PipelineStage } from "mongoose";
import { IOrder, OrderModel } from "../../models/orderModel";
import { IStudentOrderRepository } from "./interface/IStudentOrderRepository";
import { GenericRepository } from "../genericRepository";
import mongoose from "mongoose";

export class StudentOrderRepository
  extends GenericRepository<IOrder>
  implements IStudentOrderRepository
{
  constructor() {
    super(OrderModel);
  }

  async getUserOrdersPaginated(
    userId: Types.ObjectId,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ orders: IOrder[]; total: number }> {
    const baseMatch: any = { userId };

    if (!search || !search.trim()) {
      baseMatch.status = { $in: ["SUCCESS", "FAILED"] };
      const { data, total } = await this.paginate(
        baseMatch,
        page,
        limit,
        {
          status: 1,
          createdAt: -1,
        },
        ["courses"]
      );
      return { orders: data, total };
    }

    const trimmedSearch = search.trim().toLowerCase();
    const validStatuses = ["success", "pending", "failed", "cancelled", "refunded"];
    const isStatusSearch = validStatuses.includes(trimmedSearch);

    if (isStatusSearch) {
      baseMatch.status = trimmedSearch.toUpperCase();
      const { data, total } = await this.paginate(
        baseMatch,
        page,
        limit,
        { createdAt: -1 },
        ["courses"]
      );
      return { orders: data, total };
    }

    const pipeline: PipelineStage[] = [
      { $match: baseMatch },
      {
        $addFields: {
          orderIdString: { $toString: "$_id" },
          statusPriority: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "SUCCESS"] }, then: 1 },
                { case: { $eq: ["$status", "FAILED"] }, then: 2 },
              ],
              default: 3,
            },
          },
        },
      },
      {
        $match: {
          orderIdString: {
            $regex: trimmedSearch,
            $options: "i",
          },
        },
      },
      {
        $sort: {
          statusPriority: 1,
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courses",
        },
      },
    ];

    const countPipeline: PipelineStage[] = [...pipeline, { $count: "total" }];
    const dataPipeline: PipelineStage[] = [
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const [countResult, dataResult] = await Promise.all([
      this.aggregate<{ total: number }>(countPipeline),
      this.aggregate<IOrder>(dataPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    return { orders: dataResult, total };
  }

  async getOrderById(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: mongoose.ClientSession
  ): Promise<IOrder | null> {
    if (session) {
      return await this.model
        .findOne({ _id: orderId, userId })
        .populate("courses userId")
        .session(session)
        .exec();
    }
    return await this.findOne({ _id: orderId, userId }, ["courses", "userId"]);
  }
}
