import { InstructorMembershipOrderDTO } from "../../../models/instructorMembershipOrderModel";
import { AdminMembershipOrderListDTO } from "../../../dto/adminDTO/membershipOrderListDTO";

export interface IAdminMembershipOrderService {
  getAllOrders(
    page: number,
    limit: number,
    search?: string,
    status?: "paid" | "failed" | "cancelled",
  ): Promise<{ data: AdminMembershipOrderListDTO[]; total: number }>;

  getOrderDetail(
    razorpayOrderId: string,
  ): Promise<InstructorMembershipOrderDTO>;
}
