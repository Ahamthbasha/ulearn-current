import { InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";

export interface IAdminMembershipOrderRepository {
  findAllPaginated(
    page: number,
    limit: number
  ): Promise<{ data: InstructorMembershipOrderDTO[]; total: number }>;
  findByTxnId(txnId: string): Promise<InstructorMembershipOrderDTO | null>;
}
