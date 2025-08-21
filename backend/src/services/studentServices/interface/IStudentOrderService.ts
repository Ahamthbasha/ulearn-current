import { Types } from "mongoose";
import { IOrder } from "../../../models/orderModel";
import { OrderHistoryDTO } from "../../../dto/userDTO/orderHistoryDTO";
import { OrderDetailsDTO } from "../../../dto/userDTO/orderDetailsDTO";

export interface IStudentOrderService {
  getOrderHistoryPaginated(
    userId: Types.ObjectId, 
    page: number, 
    limit: number, 
    search?: string
  ): Promise<{ 
    orders: OrderHistoryDTO[]; 
    total: number 
  }>;
  
  getOrderDetails(
    orderId: Types.ObjectId, 
    userId: Types.ObjectId
  ): Promise<OrderDetailsDTO | null>;
  
  // For internal use when raw order data is needed (like for invoice generation)
  getOrderRaw(
    orderId: Types.ObjectId, 
    userId: Types.ObjectId
  ): Promise<IOrder | null>;
}