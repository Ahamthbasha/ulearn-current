import { IInstructorMembershipOrder } from "../../models/instructorMembershipOrderModel";

export interface IInstructorMembershipOrderService {
  initiateCheckout(
    instructorId: string,
    planId: string
  ): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    planName: string;
    durationInDays: number;
    description: string;
    benefits: string[];
  }>;

  verifyAndActivateMembership(details: {
    razorpayOrderId: string;
    paymentId: string;
    signature: string;
    instructorId: string;
    planId: string; // ✅ newly added
  }): Promise<void>;

  purchaseWithWallet(instructorId: string, planId: string): Promise<void>;

  getInstructorOrders(
    instructorId: string,
    page?: number,
    limit?: number
  ): Promise<{ data: IInstructorMembershipOrder[]; total: number }>;

  getOrderByTxnId(txnId: string, instructorId: string): Promise<IInstructorMembershipOrder | null>;
}
