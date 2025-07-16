export interface IWalletPaymentRepository {
  createRazorpayOrder(amount: number): Promise<any>;
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean;
}
