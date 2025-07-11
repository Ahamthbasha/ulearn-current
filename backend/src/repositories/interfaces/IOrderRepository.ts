import { IGenericRepository } from "../genericRepository";
import { IOrder } from "../../models/orderModel";

export interface IOrderRepository extends IGenericRepository<IOrder> {
  // Add specific methods here if needed
}
