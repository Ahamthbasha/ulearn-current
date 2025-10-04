import { Types } from "mongoose";

export interface CourseInfoDTO {
  courseId: Types.ObjectId;
  courseName: string;
  courseOriginalPrice: number;
  courseOfferDiscount?: number;
  courseOfferPrice: number;
  thumbnailUrl?: string; // Optional, used only when includeThumbnail is true
}

export interface CouponInfoDTO {
  couponId: Types.ObjectId;
  couponCode: string;
  couponDiscountPercentage: number;
  discountAmount: number;
}

export interface UserInfoDTO {
  username: string;
  email: string;
}