// adminCouponMapper.ts
import { formatDate } from "../../utils/dateFormat";
import { adminCouponDto } from "../../dto/adminDTO/adminCouponDTO";
import { ICoupon } from "../../models/couponModel";

export const mapToCouponDto = (coupon: ICoupon): adminCouponDto => {
  const currentDate = new Date();
  const expiryDate = new Date(coupon.expiryDate);
  
  // Set time to start of day for accurate comparison
  currentDate.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  // A coupon is active only if status is true AND it hasn't expired
  const isActive = coupon.status && expiryDate >= currentDate;
  
  return {
    couponId: coupon._id.toString(),
    code: coupon.code,
    discount: coupon.discount,
    status: isActive,
    minPurchase: coupon.minPurchase,
    maxDiscount: coupon.maxDiscount,
    expiryDate: formatDate(new Date(coupon.expiryDate)),
  };
};

export const mapToCouponListDto = (coupons: ICoupon[]): adminCouponDto[] => {
  return coupons.map(mapToCouponDto);
};
