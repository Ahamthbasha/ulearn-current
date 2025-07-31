import { Types } from 'mongoose';
import { IWithdrawalRequest } from '../../models/withdrawalRequestModel';
import { IPaginationOptions } from '../../types/IPagination';

export interface IWithdrawalRequestService {
  createWithdrawalRequest(
    instructorId: Types.ObjectId,
    amount: number
  ): Promise<IWithdrawalRequest>;
  approveWithdrawalRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
    remarks?: string
  ): Promise<IWithdrawalRequest>;
  rejectWithdrawalRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
    remarks?: string
  ): Promise<IWithdrawalRequest>;
  retryWithdrawalRequest(
    requestId: Types.ObjectId,
    amount?: number
  ): Promise<IWithdrawalRequest>;
  getInstructorRequestsWithPagination(
    instructorId: Types.ObjectId,
    options: IPaginationOptions
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }>;
  getAllRequestsWithPagination(
    options: IPaginationOptions
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }>;
  getWithdrawalRequestById(requestId: Types.ObjectId): Promise<IWithdrawalRequest>;
}