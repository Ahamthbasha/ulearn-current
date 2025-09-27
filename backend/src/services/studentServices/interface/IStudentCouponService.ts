import { ICoupon } from "../../../models/couponModel";

export interface IStudentCouponService {
  getAvailableCoupons(): Promise<ICoupon[]>;
}