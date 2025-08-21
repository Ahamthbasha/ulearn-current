import { IAdminMembershipOrderRepository } from "../../repositories/adminRepository/interface/IAdminMembershipOrderRepository"; 
import { IAdminMembershipOrderService } from "./interface/IAdminMembershipOrderService"; 
import { InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";
import { AdminMembershipOrderListDTO } from "../../dto/adminDTO/membershipOrderListDTO";
import { mapMembershipOrdersToListDTO } from "../../mappers/adminMapper/membershipOrderListMapper";


export class AdminMembershipOrderService implements IAdminMembershipOrderService {
  private _orderRepo: IAdminMembershipOrderRepository
  constructor(orderRepo: IAdminMembershipOrderRepository) {
    this._orderRepo = orderRepo
  }

  async getAllOrders(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ data: AdminMembershipOrderListDTO[]; total: number }> {
    const { data, total } = await this._orderRepo.findAllPaginated(page, limit, search);
    const mappedData = mapMembershipOrdersToListDTO(data);
    return { data: mappedData, total };
  }

  async getOrderDetail(txnId: string): Promise<InstructorMembershipOrderDTO> {
    const order = await this._orderRepo.findByTxnId(txnId);
    if (!order) {
      throw new Error("Order not found");
    }
    return order;
  }
}
