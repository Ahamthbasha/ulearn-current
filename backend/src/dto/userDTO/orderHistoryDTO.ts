import { Types } from "mongoose";

export interface OrderHistoryDTO {
  orderId: Types.ObjectId;
  orderDate: string;
  finalPrice: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
}
