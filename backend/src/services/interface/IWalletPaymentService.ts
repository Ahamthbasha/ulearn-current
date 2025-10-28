
import { IWallet } from "../../models/walletModel";
import { IRazorpayOrder, IVerifyPaymentDetails } from "../../types/razorpay";

export interface IWalletPaymentService {
  createOrder(amount: number): Promise<IRazorpayOrder>;
  verifyAndCreditWallet(details: IVerifyPaymentDetails): Promise<IWallet>;
}