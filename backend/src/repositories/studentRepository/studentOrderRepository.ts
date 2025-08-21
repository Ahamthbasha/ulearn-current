import { Types, PipelineStage } from "mongoose";
import { IOrder, OrderModel } from "../../models/orderModel";
import { IStudentOrderRepository } from "./interface/IStudentOrderRepository";
import { GenericRepository } from "../genericRepository";

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
    search?: string,
  ): Promise<{ orders: IOrder[]; total: number }> {
    if (search && search.trim()) {
      const baseMatch = { userId, status: "SUCCESS" };

      const pipeline: PipelineStage[] = [
        { $match: baseMatch },
        {
          $addFields: {
            orderIdString: { $toString: "$_id" },
          },
        },
        {
          $match: {
            orderIdString: {
              $regex: search.trim(),
              $options: "i",
            },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "courses",
            localField: "courses",
            foreignField: "_id",
            as: "courses",
          },
        },
      ];

      // Get total count using inherited aggregate method
      const countPipeline: PipelineStage[] = [...pipeline, { $count: "total" }];

      // Get paginated results using inherited aggregate method
      const dataPipeline: PipelineStage[] = [
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];

      const [countResult, dataResult] = await Promise.all([
        this.aggregate<{ total: number }>(countPipeline),
        this.aggregate<IOrder>(dataPipeline),
      ]);

      const total = countResult.length > 0 ? countResult[0].total : 0;

      return { orders: dataResult, total };
    }

    // If no search, use the regular pagination
    const { data, total } = await this.paginate(
      { userId, status: "SUCCESS" },
      page,
      limit,
      { createdAt: -1 },
      ["courses"],
    );

    return { orders: data, total };
  }

  async getOrderById(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<IOrder | null> {
    return await this.findOne({ _id: orderId, userId, status: "SUCCESS" }, [
      "courses",
      "userId",
    ]);
  }
}
