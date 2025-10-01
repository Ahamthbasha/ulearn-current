export interface OrderDetailsDTO {
  customerName: string;
  customerEmail: string;
  payment: string;
  totalAmount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  orderId: string;
  orderDate: string;
  courses: {
    courseName: string;
    price: number;
    thumbnailUrl: string;
  }[];
  totalAmountWithoutDiscount:number;
  canRetryPayment: boolean;
  couponCode?: string;
  couponDiscountPercentage?: number;
  couponDiscountAmount?: number;
}
