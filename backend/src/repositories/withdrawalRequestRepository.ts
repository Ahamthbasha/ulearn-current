import { Types, SortOrder, PipelineStage } from "mongoose";
import WithdrawalRequestModel, {
  IWithdrawalRequest,
} from "../models/withdrawalRequestModel";
import { IWithdrawalRequestRepository } from "./interfaces/IWithdrawalRequestRepository";
import { IPaginationOptions } from "../types/IPagination";
import { GenericRepository } from "./genericRepository";

export class WithdrawalRequestRepository
  extends GenericRepository<IWithdrawalRequest>
  implements IWithdrawalRequestRepository
{
  constructor() {
    super(WithdrawalRequestModel);
  }

  async createWithdrawalRequest(
    instructorId: Types.ObjectId,
    amount: number,
    bankAccount: IWithdrawalRequest["bankAccount"],
  ): Promise<IWithdrawalRequest> {
    const request = await this.create({
      instructorId,
      amount,
      bankAccount,
      status: "pending",
    });
    return request;
  }

  async findById(requestId: string): Promise<IWithdrawalRequest | null> {
    return this.findByIdWithPopulate(requestId, {
      path: "instructorId",
      select: "username email",
    });
  }

  async findByInstructorIdWithPagination(
    instructorId: Types.ObjectId,
    options: IPaginationOptions,
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }> {
    const { page, limit } = options;
    const filter = { instructorId };
    const sort = { createdAt: -1 as SortOrder };
    const populate = { path: "instructorId", select: "username email" };

    const result = await this.paginate(filter, page, limit, sort, populate);
    
    return { transactions: result.data, total: result.total };
  }

  async updateStatus(
    requestId: Types.ObjectId,
    status: "approved" | "rejected",
    adminId: Types.ObjectId,
    remarks?: string,
  ): Promise<IWithdrawalRequest | null> {
    return this.updateOneWithPopulate(
      { _id: requestId },
      { status, adminId, remarks },
      { path: "instructorId", select: "username email" },
    );
  }

  async retryRequest(
    requestId: Types.ObjectId,
    amount?: number,
  ): Promise<IWithdrawalRequest | null> {
    const updateData: any = {
      status: "pending",
      adminId: undefined,
      remarks: "",
      updatedAt: new Date(),
    };

    if (amount !== undefined) {
      updateData.amount = amount;
    }

    return this.updateOneWithPopulate({ _id: requestId }, updateData, {
      path: "instructorId",
      select: "username email",
    });
  }

  async getAllRequestsWithPagination(
    options: IPaginationOptions,
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }> {
    const { page, limit, search, status } = options; // Add status from options

    // Define the aggregation pipeline
    const aggregationPipeline: PipelineStage[] = [
      // First, lookup instructor details
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
    ];

    // Build match conditions
    const matchConditions: any = {};

    // Add search condition if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      matchConditions.$or = [
        { "instructor.username": searchRegex },
        { "instructor.email": searchRegex },
        { "bankAccount.accountHolderName": searchRegex },
      ];
    }

    // Add status filter condition if provided
    if (status && status.trim()) {
      matchConditions.status = status.trim();
    }

    if (Object.keys(matchConditions).length > 0) {
      aggregationPipeline.push({
        $match: matchConditions,
      });
    }

    aggregationPipeline.push(
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "pending"] }, then: 1 },
                { case: { $eq: ["$status", "rejected"] }, then: 2 },
                { case: { $eq: ["$status", "approved"] }, then: 3 },
              ],
              default: 4,
            },
          },
        },
      },
      { $sort: { statusOrder: 1, createdAt: -1 } },
    );

    const countPipeline = [...aggregationPipeline, { $count: "total" }];
    const countResult =
      await WithdrawalRequestModel.aggregate(countPipeline).exec();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    aggregationPipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          // Withdrawal request fields
          _id: 1,
          instructorId: 1,
          amount: 1,
          bankAccount: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          adminId: 1,
          remarks: 1,
          // Instructor fields
          instructor: {
            _id: "$instructor._id",
            username: "$instructor.username",
            email: "$instructor.email",
          },
        },
      },
    );

    const result =
      await WithdrawalRequestModel.aggregate(aggregationPipeline).exec();
    return { transactions: result || [], total };
  }

   async getTotalPendingAmount(instructorId: Types.ObjectId): Promise<number> {
    const result = await this.aggregate([
      {
        $match: {
          instructorId: instructorId,
          status: "pending"
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$amount" }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalPending : 0;
  }
}