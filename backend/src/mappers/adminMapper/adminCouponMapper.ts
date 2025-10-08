import { formatDate } from "../../utils/dateFormat";
import { adminCouponDto } from "../../dto/adminDTO/adminCouponDTO";

import {ICoupon} from "../../models/couponModel"
export const mapToCouponDto = (coupon: ICoupon): adminCouponDto => {
  return {
    couponId: coupon._id.toString(),
    code: coupon.code,
    discount: coupon.discount,
    status: coupon.status,
    minPurchase: coupon.minPurchase,
    maxDiscount: coupon.maxDiscount,
    expiryDate: formatDate(new Date(coupon.expiryDate)),
  };
};

export const mapToCouponListDto = (coupons: ICoupon[]): adminCouponDto[] => {
  return coupons.map(mapToCouponDto);
};