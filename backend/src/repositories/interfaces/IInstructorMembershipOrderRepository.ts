import { IInstructorMembershipOrder } from "../../models/instructorMembershipOrderModel";

export interface IInstructorMembershipOrderRepository {
  createOrder(data: {
  instructorId: string;
  planId: string;
  razorpayOrderId: string;
  amount: number;
  status: "pending" | "paid";
  startDate?: Date;
  endDate?: Date;
}): Promise<IInstructorMembershipOrder>;


  findByRazorpayOrderId(orderId: string): Promise<IInstructorMembershipOrder | null>; // ✅
  
  updateOrderStatus(orderId: string, data: Partial<IInstructorMembershipOrder>): Promise<void>; // ✅

  findAllByInstructorId(
  instructorId: string,
  page?: number,
  limit?: number
): Promise<{ data: IInstructorMembershipOrder[]; total: number }>;


  findOneByTxnId(txnId: string): Promise<IInstructorMembershipOrder | null>

}
