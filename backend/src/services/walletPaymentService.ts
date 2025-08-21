import { Types } from "mongoose";
import { IWallet } from "../models/walletModel";
import { IWalletPaymentService } from "./interface/IWalletPaymentService";
import { IWalletPaymentRepository } from "../repositories/interfaces/IWalletPaymentRepository";
import { IWalletService } from "./interface/IWalletService";

export class WalletPaymentService implements IWalletPaymentService {
    private _paymentRepo: IWalletPaymentRepository
    private _walletService: IWalletService
  constructor(paymentRepo: IWalletPaymentRepository,walletService: IWalletService){
    this._paymentRepo = paymentRepo
    this._walletService = walletService
  }

  async createOrder(amount: number): Promise<any> {
    return this._paymentRepo.createRazorpayOrder(amount);
  }

  async verifyAndCreditWallet({
  orderId,
  paymentId,
  signature,
  amount,
  userId,
  role,
  onModel,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  amount: number;
  userId: string;
  role: 'student' | 'instructor' | 'admin';
  onModel: 'User' | 'Instructor' | 'Admin';
}): Promise<IWallet> {
  const isValid = this._paymentRepo.verifyPaymentSignature(orderId, paymentId, signature);
  if (!isValid) throw new Error("Invalid Razorpay signature");

  const userObjectId = new Types.ObjectId(userId);

  let wallet = await this._walletService.getWallet(userObjectId);
  if (!wallet) {
    wallet = await this._walletService.initializeWallet(userObjectId, onModel, role);
  }

  const creditedWallet = await this._walletService.creditWallet(
    userObjectId,
    amount,
    "Wallet Recharge",
    paymentId
  );

  if (!creditedWallet) throw new Error("Failed to credit wallet");

  return creditedWallet;
}
}