import { Types } from "mongoose";
import { IWallet } from "../models/walletModel";
import { IWalletPaymentService } from "./interface/IWalletPaymentService";
import { IWalletPaymentRepository } from "../repositories/interfaces/IWalletPaymentRepository";
import { IWalletService } from "./interface/IWalletService";

export class WalletPaymentService implements IWalletPaymentService {
  constructor(
    private paymentRepo: IWalletPaymentRepository,
    private walletService: IWalletService
  ) {}

  async createOrder(amount: number): Promise<any> {
    return this.paymentRepo.createRazorpayOrder(amount);
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
  const isValid = this.paymentRepo.verifyPaymentSignature(orderId, paymentId, signature);
  if (!isValid) throw new Error("Invalid Razorpay signature");

  const userObjectId = new Types.ObjectId(userId);

  let wallet = await this.walletService.getWallet(userObjectId);
  if (!wallet) {
    wallet = await this.walletService.initializeWallet(userObjectId, onModel, role);
  }

  const creditedWallet = await this.walletService.creditWallet(
    userObjectId,
    amount,
    "Wallet Recharge",
    paymentId
  );

  if (!creditedWallet) throw new Error("Failed to credit wallet");

  return creditedWallet;
}


}

