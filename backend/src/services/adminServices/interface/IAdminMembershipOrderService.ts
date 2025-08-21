import { InstructorMembershipOrderDTO } from "../../../models/instructorMembershipOrderModel";
import { AdminMembershipOrderListDTO } from "../../../dto/adminDTO/membershipOrderListDTO";

export interface IAdminMembershipOrderService {
  getAllOrders(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: AdminMembershipOrderListDTO[]; total: number }>;

  getOrderDetail(txnId: string): Promise<InstructorMembershipOrderDTO>;
}
