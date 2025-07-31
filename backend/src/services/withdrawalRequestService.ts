import { Types } from 'mongoose';
import { IWithdrawalRequestService } from './interface/IWithdrawalRequestService';
import { IWithdrawalRequestRepository } from '../repositories/interfaces/IWithdrawalRequestRepository';
import { IWalletService } from './interface/IWalletService';
import IInstructorRepository from '../repositories/interfaces/IInstructorRepository';
import { IWithdrawalRequest } from '../models/withdrawalRequestModel';
import { v4 as uuidv4 } from 'uuid';
import { IPaginationOptions } from '../types/IPagination';

export class WithdrawalRequestService implements IWithdrawalRequestService {
  constructor(
    private withdrawalRequestRepo: IWithdrawalRequestRepository,
    private walletService: IWalletService,
    private instructorRepo: IInstructorRepository
  ) {}

  async createWithdrawalRequest(
    instructorId: Types.ObjectId,
    amount: number
  ): Promise<IWithdrawalRequest> {
    const instructor = await this.instructorRepo.findById(instructorId.toString());
    if (!instructor) {
      throw new Error('Instructor not found');
    }

    const bankAccount = instructor.bankAccount;
    if (
      !bankAccount ||
      !bankAccount.accountHolderName ||
      !bankAccount.accountNumber ||
      !bankAccount.ifscCode ||
      !bankAccount.bankName
    ) {
      throw new Error('Bank account details are incomplete');
    }

    const validatedBankAccount: IWithdrawalRequest['bankAccount'] = {
      accountHolderName: bankAccount.accountHolderName,
      accountNumber: bankAccount.accountNumber,
      ifscCode: bankAccount.ifscCode,
      bankName: bankAccount.bankName,
    };

    const wallet = await this.walletService.getWallet(instructorId);
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    return this.withdrawalRequestRepo.createWithdrawalRequest(
      instructorId,
      amount,
      validatedBankAccount
    );
  }

  async approveWithdrawalRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
    remarks?: string
  ): Promise<IWithdrawalRequest> {
    const request = await this.withdrawalRequestRepo.findById(requestId.toString());
    if (!request) {
      throw new Error('Withdrawal request not found');
    }
    if (request.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }

    let instructorId: Types.ObjectId;
    if (request.instructorId instanceof Types.ObjectId) {
      instructorId = request.instructorId;
    } else {
      instructorId = new Types.ObjectId(request.instructorId._id.toString());
    }

    const wallet = await this.walletService.debitWallet(
      instructorId,
      request.amount,
      `Withdrawal approved by admin: ${remarks || 'No remarks'}`,
      uuidv4()
    );
    if (!wallet) {
      throw new Error('Failed to debit wallet');
    }

    const updatedRequest = await this.withdrawalRequestRepo.updateStatus(
      requestId,
      'approved',
      adminId,
      remarks
    );
    if (!updatedRequest) {
      throw new Error('Failed to update withdrawal request status');
    }

    return updatedRequest;
  }

  async rejectWithdrawalRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
    remarks?: string
  ): Promise<IWithdrawalRequest> {
    const request = await this.withdrawalRequestRepo.findById(requestId.toString());
    if (!request) {
      throw new Error('Withdrawal request not found');
    }
    if (request.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }

    const updatedRequest = await this.withdrawalRequestRepo.updateStatus(
      requestId,
      'rejected',
      adminId,
      remarks
    );
    if (!updatedRequest) {
      throw new Error('Failed to update withdrawal request status');
    }

    return updatedRequest;
  }

  async retryWithdrawalRequest(
    requestId: Types.ObjectId,
    amount?: number
  ): Promise<IWithdrawalRequest> {
    const request = await this.withdrawalRequestRepo.findById(requestId.toString());
    if (!request) {
      throw new Error('Withdrawal request not found');
    }

    if (request.status !== 'rejected') {
      throw new Error('Only rejected requests can be retried');
    }

    let instructorId: Types.ObjectId;
    if (request.instructorId instanceof Types.ObjectId) {
      instructorId = request.instructorId;
    } else {
      instructorId = new Types.ObjectId(request.instructorId._id.toString());
    }

    if (amount !== undefined) {
      const wallet = await this.walletService.getWallet(instructorId);
      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient wallet balance for the new amount');
      }
    }

    const updatedRequest = await this.withdrawalRequestRepo.retryRequest(
      requestId,
      amount
    );
    if (!updatedRequest) {
      throw new Error('Failed to retry withdrawal request');
    }

    return updatedRequest;
  }

  async getInstructorRequestsWithPagination(
    instructorId: Types.ObjectId,
    options: IPaginationOptions
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }> {
    return this.withdrawalRequestRepo.findByInstructorIdWithPagination(instructorId, options);
  }

  async getAllRequestsWithPagination(
    options: IPaginationOptions
  ): Promise<{ transactions: IWithdrawalRequest[]; total: number }> {
    return this.withdrawalRequestRepo.getAllRequestsWithPagination(options);
  }

  async getWithdrawalRequestById(requestId: Types.ObjectId): Promise<IWithdrawalRequest> {
    const request = await this.withdrawalRequestRepo.findById(requestId.toString());
    if (!request) {
      throw new Error('Withdrawal request not found');
    }
    return request;
  }
}