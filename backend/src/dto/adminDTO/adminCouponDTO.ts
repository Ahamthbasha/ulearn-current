export interface adminCouponDto {
  couponId: string;
  code: string;
  discount: number;
  status: boolean;
  minPurchase: number;
  maxDiscount: number;
  expiryDate: string;
}
