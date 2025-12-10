import type { RazorpayInstance, RazorpayOptions } from "./types/interfaces/ICommon";

export {};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
