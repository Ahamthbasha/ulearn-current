
import { Types } from "mongoose";
import { IWallet } from "../models/walletModel";
import { IWalletPaymentService } from "./interface/IWalletPaymentService";
import { IWalletPaymentRepository } from "../repositories/interfaces/IWalletPaymentRepository";
import { IWalletService } from "./interface/IWalletService";
import { 
  IRazorpayOrder, 
  IVerifyPaymentDetails 
} from "../types/razorpay";
import { 
  BadRequestError, 
  InternalServerError,
  UnauthorizedError 
} from "../utils/error";
import { appLogger } from "../utils/logger";

export class WalletPaymentService implements IWalletPaymentService {
  private _paymentRepo: IWalletPaymentRepository;
  private _walletService: IWalletService;

  constructor(
    paymentRepo: IWalletPaymentRepository,
    walletService: IWalletService,
  ) {
    this._paymentRepo = paymentRepo;
    this._walletService = walletService;
  }

  async createOrder(amount: number): Promise<IRazorpayOrder> {
    try {
      // Validate amount
      if (!amount || amount <= 0) {
        throw new BadRequestError("Amount must be greater than zero");
      }

      // Optional: Add maximum amount limit
      const MAX_AMOUNT = 100000; // ₹1,00,000
      if (amount > MAX_AMOUNT) {
        throw new BadRequestError(
          `Amount cannot exceed ₹${MAX_AMOUNT.toLocaleString()}`
        );
      }

      return await this._paymentRepo.createRazorpayOrder(amount);
    } catch (error) {
      if (
        error instanceof BadRequestError || 
        error instanceof InternalServerError
      ) {
        throw error;
      }

      appLogger.error("Error in createOrder service", { error, amount });
      throw new InternalServerError("Failed to create payment order");
    }
  }

  async verifyAndCreditWallet(
    details: IVerifyPaymentDetails
  ): Promise<IWallet> {
    const { orderId, paymentId, signature, amount, userId, role, onModel } = details;

    try {
      // Validate input
      if (!orderId || !paymentId || !signature) {
        throw new BadRequestError("Missing payment verification details");
      }

      if (!userId) {
        throw new UnauthorizedError("User authentication required");
      }

      if (!amount || amount <= 0) {
        throw new BadRequestError("Invalid amount");
      }

      // Verify payment signature
      const isValid = this._paymentRepo.verifyPaymentSignature(
        orderId,
        paymentId,
        signature,
      );

      if (!isValid) {
        appLogger.warn("Invalid payment signature detected", {
          orderId,
          paymentId,
          userId,
        });
        throw new UnauthorizedError("Payment verification failed");
      }

      const userObjectId = new Types.ObjectId(userId);

      // Get or create wallet
      let wallet = await this._walletService.getWallet(userObjectId);
      
      if (!wallet) {
        try {
          wallet = await this._walletService.initializeWallet(
            userObjectId,
            onModel,
            role,
          );
        } catch (error) {
          appLogger.error("Error initializing wallet", { 
            error, 
            userId 
          });
          throw new InternalServerError("Failed to initialize wallet");
        }
      }

      // Credit wallet
      const creditedWallet = await this._walletService.creditWallet(
        userObjectId,
        amount,
        "Wallet Recharge",
        paymentId,
      );

      if (!creditedWallet) {
        appLogger.error("Wallet credit failed after successful payment", {
          userId,
          amount,
          paymentId,
        });
        throw new InternalServerError(
          "Payment verified but wallet credit failed. Please contact support."
        );
      }

      appLogger.info("Wallet credited successfully", {
        userId,
        amount,
        paymentId,
        newBalance: creditedWallet.balance,
      });

      return creditedWallet;
    } catch (error) {
      if (
        error instanceof BadRequestError ||
        error instanceof UnauthorizedError ||
        error instanceof InternalServerError
      ) {
        throw error;
      }

      appLogger.error("Error in verifyAndCreditWallet service", { 
        error, 
        details 
      });
      throw new InternalServerError("Payment processing failed");
    }
  }
}