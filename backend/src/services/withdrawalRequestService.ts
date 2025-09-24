import { Types } from "mongoose";
import { IWithdrawalRequestService } from "./interface/IWithdrawalRequestService";
import { IWithdrawalRequestRepository } from "../repositories/interfaces/IWithdrawalRequestRepository";
import { IWalletService } from "./interface/IWalletService";
import IInstructorRepository from "../repositories/instructorRepository/interface/IInstructorRepository";
import { IWithdrawalRequest } from "../models/withdrawalRequestModel";
import { v4 as uuidv4 } from "uuid";
import { IPaginationOptions } from "../types/IPagination";
import { mapWithdrawalRequestToDTO } from "../mappers/instructorMapper/withdrawalListMapper";
import { mapWithdrawalRequestDetailToDTO } from "../mappers/adminMapper/withdrawalDetailRequest";
import { WithdrawalRequestDTO } from "../dto/instructorDTO/withdrawalRequestDTO";
import { WithdrawalRequestDetailDTO } from "../dto/adminDTO/withdrawalDetailRequest";
import { mapAdminWithdrawalRequestToDTO } from "../mappers/adminMapper/adminWithdrawalMapper";

export class WithdrawalRequestService implements IWithdrawalRequestService {
  private _withdrawalRequestRepo: IWithdrawalRequestRepository;
  private _walletService: IWalletService;
  private _instructorRepo: IInstructorRepository;

  constructor(
    withdrawalRequestRepo: IWithdrawalRequestRepository,
    walletService: IWalletService,
    instructorRepo: IInstructorRepository,
  ) {
    this._withdrawalRequestRepo = withdrawalRequestRepo;
    this._walletService = walletService;
    this._instructorRepo = instructorRepo;
  }

  async createWithdrawalRequest(
    instructorId: Types.ObjectId,
    amount: number,
  ): Promise<IWithdrawalRequest> {
    const instructor = await this._instructorRepo.findById(
      instructorId.toString(),
    );
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    const bankAccount = instructor.bankAccount;
    if (
      !bankAccount ||
      !bankAccount.accountHolderName ||
      !bankAccount.accountNumber ||
      !bankAccount.ifscCode ||
      !bankAccount.bankName
    ) {
      throw new Error("Bank account details are incomplete");
    }

    const validatedBankAccount: IWithdrawalRequest["bankAccount"] = {
      accountHolderName: bankAccount.accountHolderName,
      accountNumber: bankAccount.accountNumber,
      ifscCode: bankAccount.ifscCode,
      bankName: bankAccount.bankName,
    };

    const wallet = await this._walletService.getWallet(instructorId);
    if (!wallet || wallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const totalPendingAmount = await this._withdrawalRequestRepo.getTotalPendingAmount(instructorId)

    const availableBalance = wallet.balance - totalPendingAmount

    if(availableBalance < amount){
       throw new Error(
        `Insufficient available balance. Available: ${availableBalance}, Requested: ${amount}, Pending withdrawals: ${totalPendingAmount}`
      )
    }

    return this._withdrawalRequestRepo.createWithdrawalRequest(
      instructorId,
      amount,
      validatedBankAccount,
    );
  }

  async approveWithdrawalRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
    remarks?: string,
  ): Promise<IWithdrawalRequest> {
    const request = await this._withdrawalRequestRepo.findById(
      requestId.toString(),
    );
    if (!request) {
      throw new Error("Withdrawal request not found");
    }
    if (request.status !== "pending") {
      throw new Error("Request is not in pending status");
    }

    let instructorId: Types.ObjectId;
    if (request.instructorId instanceof Types.ObjectId) {
      instructorId = request.instructorId;
    } else {
      instructorId = new Types.ObjectId(request.instructorId._id.toString());
    }

    const wallet = await this._walletService.debitWallet(
      instructorId,
      request.amount,
      `Withdrawal approved by admin: ${remarks || "No remarks"}`,
      uuidv4(),
    );
    if (!wallet) {
      throw new Error("Failed to debit wallet");
    }

    const updatedRequest = await this._withdrawalRequestRepo.updateStatus(
      requestId,
      "approved",
      adminId,
      remarks,
    );
    if (!updatedRequest) {
      throw new Error("Failed to update withdrawal request status");
    }

    return updatedRequest;
  }

  async rejectWithdrawalRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
    remarks?: string,
  ): Promise<IWithdrawalRequest> {
    const request = await this._withdrawalRequestRepo.findById(
      requestId.toString(),
    );
    if (!request) {
      throw new Error("Withdrawal request not found");
    }
    if (request.status !== "pending") {
      throw new Error("Request is not in pending status");
    }

    const updatedRequest = await this._withdrawalRequestRepo.updateStatus(
      requestId,
      "rejected",
      adminId,
      remarks,
    );
    if (!updatedRequest) {
      throw new Error("Failed to update withdrawal request status");
    }

    return updatedRequest;
  }

  async retryWithdrawalRequest(
    requestId: Types.ObjectId,
    amount?: number,
  ): Promise<IWithdrawalRequest> {
    const request = await this._withdrawalRequestRepo.findById(
      requestId.toString(),
    );
    if (!request) {
      throw new Error("Withdrawal request not found");
    }

    if (request.status !== "rejected") {
      throw new Error("Only rejected requests can be retried");
    }

    let instructorId: Types.ObjectId;
    if (request.instructorId instanceof Types.ObjectId) {
      instructorId = request.instructorId;
    } else {
      instructorId = new Types.ObjectId(request.instructorId._id.toString());
    }

    if (amount !== undefined) {
      const wallet = await this._walletService.getWallet(instructorId);
      if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient wallet balance for the new amount");
      }

      const totalPendingAmount = await this._withdrawalRequestRepo.getTotalPendingAmount(instructorId)
      const availableBalance = wallet.balance - totalPendingAmount

      if(availableBalance < amount){
        throw new Error( `Insufficient available balance for retry. Available: ${availableBalance}, Requested: ${amount}, Pending withdrawals: ${totalPendingAmount}`)
      }
    }else {
      // Even if amount is not changed, check if original amount is still valid
      const wallet = await this._walletService.getWallet(instructorId);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const totalPendingAmount = await this._withdrawalRequestRepo.getTotalPendingAmount(instructorId);
      const availableBalance = wallet.balance - totalPendingAmount;

      if (availableBalance < request.amount) {
        throw new Error(
          `Insufficient available balance to retry original amount. Available: ${availableBalance}, Original amount: ${request.amount}, Pending withdrawals: ${totalPendingAmount}`
        );
      }
    }

    const updatedRequest = await this._withdrawalRequestRepo.retryRequest(
      requestId,
      amount,
    );
    if (!updatedRequest) {
      throw new Error("Failed to retry withdrawal request");
    }

    return updatedRequest;
  }

  async getInstructorRequestsWithPagination(
    instructorId: Types.ObjectId,
    options: IPaginationOptions,
  ): Promise<{ transactions: WithdrawalRequestDTO[]; total: number }> {
    const { transactions, total } =
      await this._withdrawalRequestRepo.findByInstructorIdWithPagination(
        instructorId,
        options,
      );
    const dtoTransactions = transactions.map(mapWithdrawalRequestToDTO);

    console.log("dto Transactions",dtoTransactions)
    
    return {
      transactions: dtoTransactions,
      total,
    };
  }

  async getAllRequestsWithPagination(
    options: IPaginationOptions,
  ): Promise<{ transactions: WithdrawalRequestDTO[]; total: number }> {
    const { transactions, total } =
      await this._withdrawalRequestRepo.getAllRequestsWithPagination(options);
    const dtoTransactions = transactions.map(mapAdminWithdrawalRequestToDTO)
    return {
      transactions:dtoTransactions,
      total,
    };
  }

  async getWithdrawalRequestById(
    requestId: Types.ObjectId,
  ): Promise<WithdrawalRequestDetailDTO> {
    const request = await this._withdrawalRequestRepo.findById(
      requestId.toString(),
    );
    if (!request) {
      throw new Error("Withdrawal request not found");
    }

    return mapWithdrawalRequestDetailToDTO(request);
  }
}