import { Types } from "mongoose";

export interface UserDTO {
  username:string,
  email:string
}

export interface CourseInfoDTO {
  courseId: Types.ObjectId;
  courseName: string;
  courseOriginalPrice: number;
  courseOfferDiscount?: number;
  courseOfferPrice: number;
  thumbnailUrl?: string;
  isAlreadyEnrolled: boolean;
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
