import { Types } from "mongoose";
import { Document } from "mongoose";
import { adminCouponDto } from "../../dto/adminDTO/adminCouponDTO";
import { ICourseOfferListDTO,ICourseOfferDetailDTO } from "../../dto/adminDTO/adminCourseOfferDTO";
import { AdminMembershipOrderListDTO} from "../../dto/adminDTO/membershipOrderListDTO";
import { InstructorMembershipOrderDTO } from "../../models/instructorMembershipOrderModel";
export interface CourseDetails {
  courseName: string;
  instructorName: string;
  coursePrice: number;
  offerPrice?: number;
  discountedPrice: number;
  adminShare: number;
}

export interface InstructorDocument {
  _id: Types.ObjectId;
  username: string;
}

export interface ICourseOrderDetails {
  courseId: Types.ObjectId;
  courseName: string;
  coursePrice: number;
  thumbnailUrl: string;
  courseOfferPercentage?: number;
  offerPrice?: number;
  instructorId: Types.ObjectId;
  isAlreadyEnrolled?: boolean;
  isLearningPathCourse?: boolean;
}

export interface ILearningPathOrderDetails {
  learningPathId: Types.ObjectId;
  learningPathName: string;
  totalPrice: number;
  thumbnailUrl: string;
  offerPercentage?: number;
  offerPrice?: number;
  courses: ICourseOrderDetails[];
}

export interface ICouponDetails {
  couponId: Types.ObjectId;
  couponName: string;
  discountPercentage: number;
  discountAmount: number;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courses: ICourseOrderDetails[];
  learningPaths: ILearningPathOrderDetails[];
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  gateway: "razorpay" | "stripe" | "wallet";
  gatewayOrderId?: string;
  paymentId?: string;
  paymentStatus?: "SUCCESS" | "FAILED";
  paymentMethod?: string;
  paymentAmount?: number;
  paymentCreatedAt?: Date;
  coupon?: ICouponDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  status: string;
  amount: number;
  gatewayOrderId?: string;
  courses: Array<{
    courseId: Types.ObjectId;
    courseName: string;
    coursePrice: number;
    thumbnailUrl: string;
    courseOfferPercentage?: number;
    offerPrice?: number;
    instructorId: Types.ObjectId;
    isAlreadyEnrolled?: boolean;
  }>;
  learningPaths: Array<{
    learningPathId: Types.ObjectId;
    learningPathName: string;
    totalPrice: number;
    thumbnailUrl: string;
    offerPercentage?: number;
    offerPrice?: number;
    courses: Array<{
      courseId: Types.ObjectId;
      courseName: string;
      coursePrice: number;
      thumbnailUrl: string;
      courseOfferPercentage?: number;
      offerPrice?: number;
      instructorId: Types.ObjectId;
      isAlreadyEnrolled?: boolean;
    }>;
  }>;
  coupon?: {
    couponId: Types.ObjectId;
    couponName: string;
    discountPercentage: number;
    discountAmount: number;
  };
}

export interface ICouponResponse {
  success: boolean;
  message?: string;
  data?: adminCouponDto;
}

export interface ICouponsResponse {
  success: boolean;
  data: {
    coupons: adminCouponDto[];
    total: number;
  };
  pagination: {
    currentPage: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface IDeleteCouponResponse {
  success: boolean;
  message: string;
}



export interface IOfferRequestsResponse {
  success: boolean;
  message: string;
  data?: ICourseOfferListDTO[];
  total?: number;
}

export interface IVerifyOfferResponse {
  success: boolean;
  message: string;
  data?: ICourseOfferDetailDTO;
}

export interface IOfferByIdResponse {
  success: boolean;
  message: string;
  data?: ICourseOfferDetailDTO;
}

export interface IMembershipOrderDTO {
  orderId: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  razorpayOrderId: string;
  membershipPlanId: Types.ObjectId;
}

export interface IGetAllOrdersResponse {
  success: boolean;
  message: string;
  data?: AdminMembershipOrderListDTO[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface IGetOrderDetailResponse {
  success: boolean;
  message: string;
  data?: InstructorMembershipOrderDTO | null;
}