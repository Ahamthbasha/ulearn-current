import {
  IInstructorMembershipOrder,
  InstructorMembershipOrderModel,
} from "../../models/instructorMembershipOrderModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorMembershipOrderRepository } from "./interface/IInstructorMembershipOrderRepository";
import { Types, PipelineStage, FilterQuery } from "mongoose";

export class InstructorMembershipOrderRepository
  extends GenericRepository<IInstructorMembershipOrder>
  implements IInstructorMembershipOrderRepository
{
  constructor() {
    super(InstructorMembershipOrderModel);
  }

  async createOrder(
    data: {
      instructorId: string;
      planId: string;
      razorpayOrderId: string;
      amount: number;
      status: "pending" | "paid";
      startDate?: Date;
      endDate?: Date;
    },
    session?: import("mongoose").ClientSession,
  ) {
    return await this.create(
      {
        instructorId: new Types.ObjectId(data.instructorId),
        membershipPlanId: new Types.ObjectId(data.planId),
        price: data.amount,
        razorpayOrderId: data.razorpayOrderId,
        paymentStatus: data.status,
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(),
      },
      session ? {session} : undefined,
    );
  }

  async findByOrderId(orderId: string) {
    return await this.findOne({ orderId });
  }

  async updateOrderStatus(
    orderId: string,
    data: Partial<IInstructorMembershipOrder>,
    session?: import("mongoose").ClientSession,
  ) {
    await this.updateOne({ orderId }, data, { session });
  }

  async findAllByInstructorId(
    instructorId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: IInstructorMembershipOrder[]; total: number }> {
    const baseFilter: FilterQuery<IInstructorMembershipOrder> = {
      instructorId: new Types.ObjectId(instructorId),
    };

    if (!search || !search.trim()) {
      baseFilter.paymentStatus = { $in: ["paid", "failed"] };
      return await this.paginate(baseFilter, page, limit, { createdAt: -1 }, [
        "membershipPlanId",
        "instructorId",
      ]);
    }

    const trimmedSearch = search.trim().toLowerCase();
    const validStatuses = ["paid", "pending", "failed", "cancelled"];
    const isStatusSearch = validStatuses.includes(trimmedSearch);

    if (isStatusSearch) {
      baseFilter.paymentStatus = trimmedSearch;
      return await this.paginate(baseFilter, page, limit, { createdAt: -1 }, [
        "membershipPlanId",
        "instructorId",
      ]);
    }

    baseFilter.paymentStatus = { $in: ["paid", "failed"] };

    const pipeline: PipelineStage[] = [
      { $match: baseFilter },
      {
        $lookup: {
          from: "membershipplans",
          localField: "membershipPlanId",
          foreignField: "_id",
          as: "membershipPlan",
        },
      },
      {
        $unwind: {
          path: "$membershipPlan",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          orderIdString: { $toString: "$orderId" },
        },
      },
      {
        $match: {
          $or: [
            { orderIdString: { $regex: trimmedSearch, $options: "i" } },
            { "membershipPlan.name": { $regex: trimmedSearch, $options: "i" } },
          ],
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "instructors",
          localField: "instructorId",
          foreignField: "_id",
          as: "instructor",
        },
      },
      {
        $addFields: {
          membershipPlanId: "$membershipPlan",
          instructorId: { $arrayElemAt: ["$instructor", 0] },
        },
      },
      {
        $project: {
          membershipPlan: 0,
          instructor: 0,
          orderIdString: 0,
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
      this.aggregate<IInstructorMembershipOrder>(dataPipeline),
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;
    return { data: dataResult, total };
  }

  async findOneByOrderId(
    orderId: string,
  ): Promise<IInstructorMembershipOrder | null> {
    const pipeline: PipelineStage[] = [
      { $match: { orderId } },
      {
        $lookup: {
          from: "instructors",
          localField: "instructorId",
          foreignField: "_id",
          as: "instructor",
        },
      },
      {
        $unwind: {
          path: "$instructor",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "membershipplans",
          localField: "membershipPlanId",
          foreignField: "_id",
          as: "membershipPlan",
        },
      },
      {
        $unwind: {
          path: "$membershipPlan",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          instructorId: {
            _id: "$instructor._id",
            username: "$instructor.username",
            email: "$instructor.email",
          },
          membershipPlanId: "$membershipPlan",
        },
      },
      {
        $project: {
          instructor: 0,
          membershipPlan: 0,
        },
      },
    ];

    const result = await this.aggregate<IInstructorMembershipOrder>(pipeline);
    return result.length > 0 ? result[0] : null;
  }

  async findExistingOrder(
    instructorId: string,
    planId: string,
    session?: import("mongoose").ClientSession,
  ): Promise<IInstructorMembershipOrder | null> {
    const timeoutMinutes = 15;
    const timeoutThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    return await this.findOne(
      {
        instructorId: new Types.ObjectId(instructorId),
        membershipPlanId: new Types.ObjectId(planId),
        paymentStatus: { $in: ["pending", "paid"] },
        createdAt: { $gte: timeoutThreshold },
      },
      undefined,
      session,
    );
  }

  async cancelOrder(
    orderId: string,
    session?: import("mongoose").ClientSession,
  ): Promise<void> {
    await this.updateOne(
      { orderId, paymentStatus: "pending" },
      { paymentStatus: "cancelled" },
      { session },
    );
  }

  async findByRazorpayOrderId(
    razorpayOrderId: string,
  ): Promise<IInstructorMembershipOrder | null> {
    return await this.findOne({ razorpayOrderId });
  }
}
