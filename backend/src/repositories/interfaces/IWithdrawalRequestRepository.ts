import { Types } from "mongoose";
import { IWithdrawalRequest } from "../../models/withdrawalRequestModel";
import { IPaginationOptions } from "../../types/IPagination";

export interface IWithdrawalRequestRepository {
  createWithdrawalRequest(
    instructorId: Types.ObjectId,
    amount: number,
    bankAccount: IWithdrawalRequest["bankAccount"],
  ): Promise<IWithdrawalRequest>;
  findById(requestId: string): Promise<IWithdrawalRequest | null>;
  findByInstructorIdWithPagination(
    instructorId: Types.ObjectId,
    options: IPaginationOptions,
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }>;
  updateStatus(
    requestId: Types.ObjectId,
    status: "approved" | "rejected",
    adminId: Types.ObjectId,
    remarks?: string,
  ): Promise<IWithdrawalRequest | null>;
  // New retry method
  retryRequest(
    requestId: Types.ObjectId,
    amount?: number,
  ): Promise<IWithdrawalRequest | null>;
  getAllRequestsWithPagination(
    options: IPaginationOptions,
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }>;
}
