
import { formatDate } from "../../utils/dateFormat";
import { adminCouponDto } from "../../dto/adminDTO/adminCouponDTO";
import { ICoupon } from "../../models/couponModel";

export const mapToCouponDto = (coupon: ICoupon): adminCouponDto => {
  const currentDate = new Date();
  const expiryDate = new Date(coupon.expiryDate);
  currentDate.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
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
