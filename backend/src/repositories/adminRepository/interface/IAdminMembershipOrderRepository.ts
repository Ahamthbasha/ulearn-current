import { InstructorMembershipOrderDTO } from "../../../models/instructorMembershipOrderModel";

export interface IAdminMembershipOrderRepository {
  findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    status?: "paid" | "failed" | "cancelled",
  ): Promise<{ data: InstructorMembershipOrderDTO[]; total: number }>;

  findByTxnId(
    razorpayOrderId: string,
  ): Promise<InstructorMembershipOrderDTO | null>;
}
