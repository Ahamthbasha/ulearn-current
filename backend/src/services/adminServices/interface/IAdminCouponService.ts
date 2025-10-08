import { adminCouponDto } from "../../../dto/adminDTO/adminCouponDTO";

import { ICoupon } from "../../../models/couponModel";
export interface IAdminCouponService {
  createCoupon(couponData: Partial<ICoupon>): Promise<adminCouponDto>;
  getAllCoupons(page: number, limit: number, searchCode?: string): Promise<{ coupons: adminCouponDto[], total: number }>;
  getCouponById(id: string): Promise<adminCouponDto | null>;
  getCouponByCode(code: string): Promise<adminCouponDto | null>;
  updateCoupon(id: string, couponData: Partial<ICoupon>): Promise<adminCouponDto | null>;
  deleteCoupon(id: string): Promise<boolean>;
  toggleCouponStatus(id: string, status: boolean): Promise<adminCouponDto | null>;
}