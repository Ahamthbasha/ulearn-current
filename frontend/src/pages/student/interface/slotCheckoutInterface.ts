export interface Instructor {
  username?: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
  price: number;
  instructorId?: Instructor;
}

export interface AvailabilityResponse {
  available: boolean;
  slot?: Slot;
  reason?: string;
  message?: string;
  bookingId?: string;
}

export interface WalletResponse {
  wallet?: {
    balance: number;
  };
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface CheckoutResponse {
  razorpayOrder: RazorpayOrder;
  booking: {
    bookingId: string;
  };
}