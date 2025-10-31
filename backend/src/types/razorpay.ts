export interface IRazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

export interface IRazorpayOrderCreateOptions {
  amount: number;
  currency: string;
  receipt: string;
  payment_capture?: boolean | number;
  notes?: Record<string, string>;
}

export interface IVerifyPaymentDetails {
  orderId: string;
  paymentId: string;
  signature: string;
  amount: number;
  userId: string;
  role: "student" | "instructor" | "admin";
  onModel: "User" | "Instructor" | "Admin";
}