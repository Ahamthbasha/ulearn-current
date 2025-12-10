export interface AdminMembershipOrderListDTO {
  instructorName: string;
  orderId: string;
  membershipName: string;
  price: number;
  status: "paid" | "pending" | "failed" | "cancelled";
}
