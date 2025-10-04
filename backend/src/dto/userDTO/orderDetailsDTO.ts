import { Types } from "mongoose";
import { CourseInfoDTO, CouponInfoDTO, UserInfoDTO } from "./courseInfoDTO";

export interface OrderDetailsDTO {
  orderId: Types.ObjectId;
  userInfo: UserInfoDTO;
  coursesInfo: CourseInfoDTO[]; // Includes thumbnailUrl
  couponInfo?: CouponInfoDTO;
  sumOfAllCourseOriginalPrice: number;
  sumOfAllCourseIncludingOfferPrice: number;
  finalPrice: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  orderDate: string;
}