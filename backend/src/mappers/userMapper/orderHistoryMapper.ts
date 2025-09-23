// src/mappers/student/toOrderHistoryDTO.ts
import { IOrder } from "../../models/orderModel";
import { OrderHistoryDTO } from "../../dto/userDTO/orderHistoryDTO";

export const toOrderHistoryDTO = (order: IOrder): OrderHistoryDTO => {
  const dateObj = new Date(order.createdAt);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return {
    orderId: order._id.toString(),
    amount: order.amount,
    gateway: order.gateway,
    date: `${day}-${month}-${year}`, 
    status:order.status
  };
};
