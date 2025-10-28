
import { Types, SortOrder, PipelineStage } from "mongoose";
import WithdrawalRequestModel, {
  IWithdrawalRequest,
} from "../models/withdrawalRequestModel";
import { IWithdrawalRequestRepository } from "./interfaces/IWithdrawalRequestRepository";
import { IPaginationOptions } from "../types/IPagination";
import { GenericRepository } from "./genericRepository";
import { 
  InternalServerError, 
  NotFoundError, 
  BadRequestError 
} from "../utils/error";
import { appLogger } from "../utils/logger";

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
    try {
      if (!instructorId || !amount || !bankAccount) {
        throw new BadRequestError("Missing required fields for withdrawal request");
      }

      const request = await this.create({
        instructorId,
        amount,
        bankAccount,
        status: "pending",
      });

      return request;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      appLogger.error("Error creating withdrawal request", { 
        error, 
        instructorId, 
        amount 
      });
      throw new InternalServerError("Failed to create withdrawal request");
    }
  }

  async findById(requestId: string): Promise<IWithdrawalRequest | null> {
    try {
      if (!Types.ObjectId.isValid(requestId)) {
        throw new BadRequestError("Invalid request ID format");
      }

      return await this.findByIdWithPopulate(requestId, {
        path: "instructorId",
        select: "username email",
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      appLogger.error("Error finding withdrawal request by ID", { 
        error, 
        requestId 
      });
      throw new InternalServerError("Failed to fetch withdrawal request");
    }
  }

  async findByInstructorIdWithPagination(
    instructorId: Types.ObjectId,
    options: IPaginationOptions,
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }> {
    try {
      const { page, limit } = options;
      const filter = { instructorId };
      const sort = { createdAt: -1 as SortOrder };
      const populate = { path: "instructorId", select: "username email" };

      const result = await this.paginate(filter, page, limit, sort, populate);

      return { transactions: result.data, total: result.total };
    } catch (error) {
      appLogger.error("Error fetching instructor withdrawal requests", { 
        error, 
        instructorId 
      });
      throw new InternalServerError(
        "Failed to fetch instructor withdrawal requests"
      );
    }
  }

  async updateStatus(
    requestId: Types.ObjectId,
    status: "approved" | "rejected",
    adminId: Types.ObjectId,
    remarks?: string,
  ): Promise<IWithdrawalRequest | null> {
    try {
      const updated = await this.updateOneWithPopulate(
        { _id: requestId },
        { status, adminId, remarks, processedAt: new Date() },
        { path: "instructorId", select: "username email" },
      );

      if (!updated) {
        throw new NotFoundError("Withdrawal request not found");
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      appLogger.error("Error updating withdrawal request status", { 
        error, 
        requestId, 
        status 
      });
      throw new InternalServerError("Failed to update withdrawal request");
    }
  }

  async retryRequest(
    requestId: Types.ObjectId,
    amount?: number,
  ): Promise<IWithdrawalRequest | null> {
    try {
      const updateData: Partial<IWithdrawalRequest> = {
        status: "pending",
        adminId: undefined,
        remarks: "",
        updatedAt: new Date(),
      };

      if (amount !== undefined) {
        if (amount <= 0) {
          throw new BadRequestError("Amount must be greater than zero");
        }
        updateData.amount = amount;
      }

      const updated = await this.updateOneWithPopulate(
        { _id: requestId },
        updateData,
        { path: "instructorId", select: "username email" },
      );

      if (!updated) {
        throw new NotFoundError("Withdrawal request not found");
      }

      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundError || 
        error instanceof BadRequestError
      ) {
        throw error;
      }
      appLogger.error("Error retrying withdrawal request", { 
        error, 
        requestId 
      });
      throw new InternalServerError("Failed to retry withdrawal request");
    }
  }

  async getAllRequestsWithPagination(
    options: IPaginationOptions,
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }> {
    try {
      const { page, limit, search, status } = options;
      const aggregationPipeline: PipelineStage[] = [
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

      const matchConditions: Record<string, unknown> = {};

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), "i");
        matchConditions.$or = [
          { "instructor.username": searchRegex },
          { "instructor.email": searchRegex },
          { "bankAccount.accountHolderName": searchRegex },
        ];
      }

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

      aggregationPipeline.push(
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            instructorId: 1,
            amount: 1,
            bankAccount: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            adminId: 1,
            remarks: 1,
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
    } catch (error) {
      appLogger.error("Error fetching all withdrawal requests", { error });
      throw new InternalServerError("Failed to fetch withdrawal requests");
    }
  }

  async getTotalPendingAmount(instructorId: Types.ObjectId): Promise<number> {
    try {
      const result = await this.aggregate([
        {
          $match: {
            instructorId: instructorId,
            status: "pending",
          },
        },
        {
          $group: {
            _id: null,
            totalPending: { $sum: "$amount" },
          },
        },
      ]);

      return result.length > 0 ? result[0].totalPending : 0;
    } catch (error) {
      appLogger.error("Error calculating total pending amount", { 
        error, 
        instructorId 
      });
      throw new InternalServerError("Failed to calculate pending amount");
    }
  }
}