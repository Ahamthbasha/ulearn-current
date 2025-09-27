import { ICoupon } from "../../../models/couponModel"; 

export interface IStudentCouponRepo {
  getAvailableCoupons(): Promise<ICoupon[]>;
}