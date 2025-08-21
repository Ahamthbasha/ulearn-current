export interface OrderDetailsDTO {
  customerName: string;
  customerEmail: string;
  payment: string; // razorpay or wallet
  totalAmount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  orderId: string;
  orderDate: string; // day-month-year hh:mm AM/PM
  courses: {
    courseName: string;
    price: number;
    thumbnailUrl: string;
  }[];
}
