import {
  InstructorMembershipOrderDTO,
  InstructorMembershipOrderListDTO,
} from "../../../models/instructorMembershipOrderModel";

export interface IInstructorMembershipOrderService {
  initiateCheckout(
    instructorId: string,
    planId: string,
  ): Promise<{
    amount: number;
    currency: string;
    planName: string;
    durationInDays: number;
    description: string;
    benefits: string[];
  }>;

  createRazorpayOrder(
    instructorId: string,
    planId: string,
  ): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
  }>;

  retryFailedOrder(
    orderId: string,
    instructorId: string,
  ): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    planId: string;
  }>;

  verifyAndActivateMembership(details: {
    razorpayOrderId: string;
    paymentId: string;
    signature: string;
    instructorId: string;
    planId: string;
  }): Promise<void>;

  purchaseWithWallet(instructorId: string, planId: string): Promise<void>;

  getInstructorOrders(
    instructorId: string,
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<{ data: InstructorMembershipOrderListDTO[]; total: number }>;

  getOrderByOrderId(
    orderId: string,
    instructorId: string,
  ): Promise<InstructorMembershipOrderDTO | null>;

  cancelOrder(orderId: string, instructorId: string): Promise<void>;

  markOrderAsFailed(orderId: string, instructorId: string): Promise<void>;
}
