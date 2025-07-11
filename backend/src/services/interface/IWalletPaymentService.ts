import { IWallet } from "../../models/walletModel";

export interface IWalletPaymentService {
  createOrder(amount: number): Promise<any>;
  verifyAndCreditWallet(details: {
    orderId: string;
    paymentId: string;
    signature: string;
    amount: number;
    userId: string;
    role: 'student' | 'instructor' | 'admin';    // ✅ Add this
    onModel: 'User' | 'Instructor' | 'Admin';     // ✅ Add this
  }): Promise<IWallet>;
}
