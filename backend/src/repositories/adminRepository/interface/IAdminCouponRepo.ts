import { Types } from "mongoose";
import { ICoupon } from "../../../models/couponModel";

export interface IAdminCouponRepo {
  createCoupon(couponData: Partial<ICoupon>): Promise<ICoupon>;
  getAllCoupons(
    page: number,
    limit: number,
    searchCode?: string,
  ): Promise<{ coupons: ICoupon[]; total: number }>;
  getCouponById(id: Types.ObjectId): Promise<ICoupon | null>;
  getCouponByCode(code: string): Promise<ICoupon | null>;
  updateCoupon(
    id: Types.ObjectId,
    couponData: Partial<ICoupon>,
  ): Promise<ICoupon | null>;
  deleteCoupon(id: Types.ObjectId): Promise<boolean>;
  toggleCouponStatus(
    id: Types.ObjectId,
    status: boolean,
  ): Promise<ICoupon | null>;
}
