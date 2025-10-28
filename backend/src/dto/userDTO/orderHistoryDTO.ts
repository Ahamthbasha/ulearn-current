import { Types } from "mongoose";

export interface OrderHistoryDTO {
  orderId: Types.ObjectId;
  orderDate: string; // Formatted as "DD-MM-YYYY"
  finalPrice: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
}
