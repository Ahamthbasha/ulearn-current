import { InstructorMembershipOrderDTO } from "../../../models/instructorMembershipOrderModel";

export interface IAdminMembershipOrderRepository {
  findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: InstructorMembershipOrderDTO[]; total: number }>;

  findByTxnId(
    razorpayOrderId: string,
  ): Promise<InstructorMembershipOrderDTO | null>;
}
