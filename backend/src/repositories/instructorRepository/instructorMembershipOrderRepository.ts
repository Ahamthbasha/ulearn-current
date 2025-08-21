import {
  InstructorMembershipOrderModel,
  IInstructorMembershipOrder,
} from "../../models/instructorMembershipOrderModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorMembershipOrderRepository } from "./interface/IInstructorMembershipOrderRepository"; 
import { Types, PipelineStage } from "mongoose";

export class InstructorMembershipOrderRepository
  extends GenericRepository<IInstructorMembershipOrder>
  implements IInstructorMembershipOrderRepository
{
  constructor() {
    super(InstructorMembershipOrderModel);
  }

  async createOrder(data: {
    instructorId: string;
    planId: string;
    razorpayOrderId: string;
    amount: number;
    status: "pending" | "paid";
    startDate?: Date;
    endDate?: Date;
  }) {
    return await this.create({
      instructorId: new Types.ObjectId(data.instructorId),
      membershipPlanId: new Types.ObjectId(data.planId),
      price: data.amount,
      txnId: data.razorpayOrderId,
      paymentStatus: data.status,
      startDate: data.startDate || new Date(),
      endDate: data.endDate || new Date(),
    });
  }

  async findByRazorpayOrderId(orderId: string) {
    return await this.findOne({ txnId: orderId });
  }

  async updateOrderStatus(
    orderId: string,
    data: Partial<IInstructorMembershipOrder>
  ) {
    await this.updateOne({ txnId: orderId }, data);
  }

  async findAllByInstructorId(
    instructorId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ data: IInstructorMembershipOrder[]; total: number }> {
    const baseFilter = {
      instructorId: new Types.ObjectId(instructorId),
      paymentStatus: "paid",
    };

    if (search && search.trim()) {
      const pipeline: PipelineStage[] = [
        { $match: baseFilter },
        {
          $lookup: {
            from: "membershipplans",
            localField: "membershipPlanId",
            foreignField: "_id",
            as: "membershipPlan"
          }
        },
        {
          $unwind: {
            path: "$membershipPlan",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            txnIdString: { $toString: "$txnId" }
          }
        },
        {
          $match: {
            $or: [
              {
                txnIdString: {
                  $regex: search.trim(),
                  $options: "i"
                }
              },
              {
                "membershipPlan.name": {
                  $regex: search.trim(),
                  $options: "i"
                }
              }
            ]
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "instructors",
            localField: "instructorId",
            foreignField: "_id",
            as: "instructor"
          }
        },
        {
          $addFields: {
            membershipPlanId: "$membershipPlan",
            instructorId: { $arrayElemAt: ["$instructor", 0] }
          }
        },
        {
          $project: {
            membershipPlan: 0,
            instructor: 0,
            txnIdString: 0
          }
        }
      ];

      const countPipeline: PipelineStage[] = [
        ...pipeline,
        { $count: "total" }
      ];

      const dataPipeline: PipelineStage[] = [
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ];

      const [countResult, dataResult] = await Promise.all([
        this.aggregate<{ total: number }>(countPipeline),
        this.aggregate<IInstructorMembershipOrder>(dataPipeline)
      ]);

      const total = countResult.length > 0 ? countResult[0].total : 0;
      return { data: dataResult, total };
    }

    return await this.paginate(baseFilter, page, limit, { createdAt: -1 }, [
      "membershipPlanId",
      "instructorId"
    ]);
  }

  async findOneByTxnId(txnId: string): Promise<IInstructorMembershipOrder | null> {
    const pipeline: PipelineStage[] = [
      { $match: { txnId } },
      {
        $lookup: {
          from: "instructors",
          localField: "instructorId",
          foreignField: "_id",
          as: "instructor"
        }
      },
      {
        $unwind: {
          path: "$instructor",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "membershipplans",
          localField: "membershipPlanId",
          foreignField: "_id",
          as: "membershipPlan"
        }
      },
      {
        $unwind: {
          path: "$membershipPlan",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          instructorId: {
            _id: "$instructor._id",
            username: "$instructor.username",
            email: "$instructor.email"
          },
          membershipPlanId: "$membershipPlan"
        }
      },
      {
        $project: {
          instructor: 0,
          membershipPlan: 0
        }
      }
    ];

    const result = await this.aggregate<IInstructorMembershipOrder>(pipeline);
    return result.length > 0 ? result[0] : null;
  }
}