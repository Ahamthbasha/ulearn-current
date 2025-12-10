export interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id?: string;
    };
  };
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  modal?: {
    ondismiss?: () => void;
    onhidden?: () => void;
    escape?: boolean;
    backdrop_close?: boolean;
  };
  prefill?: {
    name?: string;
    email?: string;
  };
  theme: {
    color: string;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayErrorResponse) => void) => void;
  close?: () => void;
}


export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
      orderId?:string;
    };
    status?:number;
  };
  message?:string
}


export interface IncomingCallPayload {
  offer: RTCSessionDescriptionInit;
  from?: string;
  callType?: string;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
  from?: string;
}

export interface CallAnswerPayload {
  answer: RTCSessionDescriptionInit;
  from?: string;
}