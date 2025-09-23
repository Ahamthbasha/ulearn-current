export interface ListInstructorParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "asc" | "desc"; // ✅ Add this
  skill?: string;
  expertise?: string;
}


export interface RetryPaymentResponse {
  success: boolean;
  message: string;
  paymentData?: {
    orderId: string;
    amount: number;
    currency: string;
    razorpayOrderId?: string;
    key?:string
  };
}