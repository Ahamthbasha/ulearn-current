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
import { 
  NotFoundError, 
  BadRequestError, 
  InternalServerError,
  ConflictError 
} from "../utils/error";
import { appLogger } from "../utils/logger";

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
    try {
      // Validate amount
      if (!amount || amount <= 0) {
        throw new BadRequestError("Amount must be greater than zero");
      }

      // Get instructor
      const instructor = await this._instructorRepo.findById(
        instructorId.toString(),
      );
      
      if (!instructor) {
        throw new NotFoundError("Instructor not found");
      }

      // Validate bank account
      const bankAccount = instructor.bankAccount;
      if (
        !bankAccount ||
        !bankAccount.accountHolderName ||
        !bankAccount.accountNumber ||
        !bankAccount.ifscCode ||
        !bankAccount.bankName
      ) {
        throw new BadRequestError(
          "Bank account details are incomplete. Please update your bank details."
        );
      }

      const validatedBankAccount: IWithdrawalRequest["bankAccount"] = {
        accountHolderName: bankAccount.accountHolderName,
        accountNumber: bankAccount.accountNumber,
        ifscCode: bankAccount.ifscCode,
        bankName: bankAccount.bankName,
      };

      // Get wallet
      const wallet = await this._walletService.getWallet(instructorId);
      if (!wallet) {
        throw new NotFoundError("Wallet not found");
      }

      if (wallet.balance < amount) {
        throw new BadRequestError(
          `Insufficient wallet balance. Available: ₹${wallet.balance}`
        );
      }

      // Check pending withdrawals
      const totalPendingAmount =
        await this._withdrawalRequestRepo.getTotalPendingAmount(instructorId);

      const availableBalance = wallet.balance - totalPendingAmount;

      if (availableBalance < amount) {
        throw new BadRequestError(
          `Insufficient available balance. Available: ₹${availableBalance}, Requested: ₹${amount}, Pending withdrawals: ₹${totalPendingAmount}`
        );
      }

      return await this._withdrawalRequestRepo.createWithdrawalRequest(
        instructorId,
        amount,
        validatedBankAccount,
      );
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BadRequestError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      appLogger.error("Error in createWithdrawalRequest service", { 
        error, 
        instructorId, 
        amount 
      });
      throw new InternalServerError("Failed to create withdrawal request");
    }
  }

  async approveWithdrawalRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
    remarks?: string,
  ): Promise<IWithdrawalRequest> {
    try {
      // Get request
      const request = await this._withdrawalRequestRepo.findById(
        requestId.toString(),
      );
      
      if (!request) {
        throw new NotFoundError("Withdrawal request not found");
      }

      if (request.status !== "pending") {
        throw new ConflictError(
          `Request is ${request.status}. Only pending requests can be approved.`
        );
      }

      // Extract instructor ID
      let instructorId: Types.ObjectId;
      if (request.instructorId instanceof Types.ObjectId) {
        instructorId = request.instructorId;
      } else {
        instructorId = new Types.ObjectId(request.instructorId._id.toString());
      }

      // Debit wallet
      const wallet = await this._walletService.debitWallet(
        instructorId,
        request.amount,
        `Withdrawal approved${remarks ? `: ${remarks}` : ""}`,
        uuidv4(),
      );

      if (!wallet) {
        throw new InternalServerError(
          "Failed to debit wallet. Please try again."
        );
      }

      // Update request status
      const updatedRequest = await this._withdrawalRequestRepo.updateStatus(
        requestId,
        "approved",
        adminId,
        remarks,
      );

      if (!updatedRequest) {
        throw new InternalServerError("Failed to update withdrawal request");
      }

      appLogger.info("Withdrawal request approved", {
        requestId,
        instructorId,
        amount: request.amount,
        adminId,
      });

      return updatedRequest;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      appLogger.error("Error in approveWithdrawalRequest service", { 
        error, 
        requestId 
      });
      throw new InternalServerError("Failed to approve withdrawal request");
    }
  }

  async rejectWithdrawalRequest(
    requestId: Types.ObjectId,
    adminId: Types.ObjectId,
    remarks?: string,
  ): Promise<IWithdrawalRequest> {
    try {
      const request = await this._withdrawalRequestRepo.findById(
        requestId.toString(),
      );
      
      if (!request) {
        throw new NotFoundError("Withdrawal request not found");
      }

      if (request.status !== "pending") {
        throw new ConflictError(
          `Request is ${request.status}. Only pending requests can be rejected.`
        );
      }

      const updatedRequest = await this._withdrawalRequestRepo.updateStatus(
        requestId,
        "rejected",
        adminId,
        remarks,
      );

      if (!updatedRequest) {
        throw new InternalServerError("Failed to update withdrawal request");
      }

      appLogger.info("Withdrawal request rejected", {
        requestId,
        adminId,
        remarks,
      });

      return updatedRequest;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      appLogger.error("Error in rejectWithdrawalRequest service", { 
        error, 
        requestId 
      });
      throw new InternalServerError("Failed to reject withdrawal request");
    }
  }

  async retryWithdrawalRequest(
    requestId: Types.ObjectId,
    amount?: number,
  ): Promise<IWithdrawalRequest> {
    try {
      const request = await this._withdrawalRequestRepo.findById(
        requestId.toString(),
      );
      
      if (!request) {
        throw new NotFoundError("Withdrawal request not found");
      }

      if (request.status !== "rejected") {
        throw new ConflictError("Only rejected requests can be retried");
      }

      // Extract instructor ID
      let instructorId: Types.ObjectId;
      if (request.instructorId instanceof Types.ObjectId) {
        instructorId = request.instructorId;
      } else {
        instructorId = new Types.ObjectId(request.instructorId._id.toString());
      }

      // Get wallet
      const wallet = await this._walletService.getWallet(instructorId);
      if (!wallet) {
        throw new NotFoundError("Wallet not found");
      }

      const retryAmount = amount !== undefined ? amount : request.amount;

      if (retryAmount <= 0) {
        throw new BadRequestError("Amount must be greater than zero");
      }

      // Check available balance
      const totalPendingAmount =
        await this._withdrawalRequestRepo.getTotalPendingAmount(instructorId);
      const availableBalance = wallet.balance - totalPendingAmount;

      if (availableBalance < retryAmount) {
        throw new BadRequestError(
          `Insufficient available balance. Available: ₹${availableBalance}, Requested: ₹${retryAmount}, Pending withdrawals: ₹${totalPendingAmount}`
        );
      }

      const updatedRequest = await this._withdrawalRequestRepo.retryRequest(
        requestId,
        amount,
      );

      if (!updatedRequest) {
        throw new InternalServerError("Failed to retry withdrawal request");
      }

      appLogger.info("Withdrawal request retried", {
        requestId,
        instructorId,
        newAmount: retryAmount,
      });

      return updatedRequest;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BadRequestError ||
        error instanceof ConflictError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      appLogger.error("Error in retryWithdrawalRequest service", { 
        error, 
        requestId 
      });
      throw new InternalServerError("Failed to retry withdrawal request");
    }
  }

  async getInstructorRequestsWithPagination(
    instructorId: Types.ObjectId,
    options: IPaginationOptions,
  ): Promise<{ transactions: WithdrawalRequestDTO[]; total: number }> {
    try {
      const { transactions, total } =
        await this._withdrawalRequestRepo.findByInstructorIdWithPagination(
          instructorId,
          options,
        );
      
      const dtoTransactions = transactions.map(mapWithdrawalRequestToDTO);

      return {
        transactions: dtoTransactions,
        total,
      };
    } catch (error) {
      if (error instanceof InternalServerError) {
        throw error;
      }
      appLogger.error("Error in getInstructorRequestsWithPagination", { 
        error, 
        instructorId 
      });
      throw new InternalServerError(
        "Failed to fetch instructor withdrawal requests"
      );
    }
  }

  async getAllRequestsWithPagination(
    options: IPaginationOptions,
  ): Promise<{ transactions: WithdrawalRequestDTO[]; total: number }> {
    try {
      const { transactions, total } =
        await this._withdrawalRequestRepo.getAllRequestsWithPagination(options);
      
      const dtoTransactions = transactions.map(mapAdminWithdrawalRequestToDTO);
      
      return {
        transactions: dtoTransactions,
        total,
      };
    } catch (error) {
      if (error instanceof InternalServerError) {
        throw error;
      }
      appLogger.error("Error in getAllRequestsWithPagination", { error });
      throw new InternalServerError("Failed to fetch withdrawal requests");
    }
  }

  async getWithdrawalRequestById(
    requestId: Types.ObjectId,
  ): Promise<WithdrawalRequestDetailDTO> {
    try {
      const request = await this._withdrawalRequestRepo.findById(
        requestId.toString(),
      );
      
      if (!request) {
        throw new NotFoundError("Withdrawal request not found");
      }

      return mapWithdrawalRequestDetailToDTO(request);
    } catch (error) {
      if (
        error instanceof NotFoundError || 
        error instanceof InternalServerError
      ) {
        throw error;
      }
      appLogger.error("Error in getWithdrawalRequestById", { 
        error, 
        requestId 
      });
      throw new InternalServerError("Failed to fetch withdrawal request");
    }
  }
}