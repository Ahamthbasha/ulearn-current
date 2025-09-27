export interface CouponData {
  code: string;
  discount: number;
  expiryDate: string;
  minPurchase: number;
  maxDiscount: number;
}

export interface ICoupon {
  _id: string;
  code: string;
  discount: number;
  expiryDate: string;
  status: boolean;
  usedBy: string[];
  minPurchase: number;
  maxDiscount: number;
}