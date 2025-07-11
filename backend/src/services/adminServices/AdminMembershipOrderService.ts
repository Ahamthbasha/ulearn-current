import { IAdminMembershipOrderRepository } from "../../repositories/interfaces/IAdminMembershipOrderRepository"; 
import { IAdminMembershipOrderService } from "../interface/IAdminMembershipOrderService";
import { InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";

export class AdminMembershipOrderService implements IAdminMembershipOrderService {
  constructor(private readonly orderRepo: IAdminMembershipOrderRepository) {}

  async getAllOrders(page: number, limit: number): Promise<{ data: InstructorMembershipOrderDTO[]; total: number }> {
    return this.orderRepo.findAllPaginated(page, limit);
  }

  async getOrderDetail(txnId: string): Promise<InstructorMembershipOrderDTO> {
    const order = await this.orderRepo.findByTxnId(txnId);
    if (!order) {
      throw new Error("Order not found");
    }
    return order;
  }
}
