import { ICoupon } from "../../../models/couponModel";

export interface IAdminCouponService {
  createCoupon(couponData: Partial<ICoupon>): Promise<ICoupon>;
  getAllCoupons(page: number, limit: number,searchCode?:string): Promise<{ coupons: ICoupon[], total: number }>;
  getCouponById(id: string): Promise<ICoupon | null>;
  getCouponByCode(code: string): Promise<ICoupon | null>;
  updateCoupon(id: string, couponData: Partial<ICoupon>): Promise<ICoupon | null>;
  deleteCoupon(id: string): Promise<boolean>;
  toggleCouponStatus(id: string, status: boolean): Promise<ICoupon | null>;
}