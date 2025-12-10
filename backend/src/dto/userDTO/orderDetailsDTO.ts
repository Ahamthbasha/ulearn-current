import { Types } from "mongoose";
import { CourseInfoDTO, CouponInfoDTO, UserInfoDTO } from "./courseInfoDTO";

export interface LearningPathInfoDTO {
  learningPathId: Types.ObjectId;
  learningPathName: string;
  totalOriginalPrice: number;
  totalOfferDiscount?: number;
  totalOfferPrice: number;
  thumbnailUrl?: string;
  courses: CourseInfoDTO[];
}

export interface OrderDetailsDTO {
  orderId: Types.ObjectId;
  userInfo: UserInfoDTO;
  coursesInfo: CourseInfoDTO[];
  learningPathsInfo: LearningPathInfoDTO[];
  couponInfo?: CouponInfoDTO;
  sumOfAllCourseOriginalPrice: number;
  sumOfAllCourseIncludingOfferPrice: number;
  finalPrice: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  orderDate: string;
}
