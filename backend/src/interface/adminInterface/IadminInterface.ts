import {Types} from "mongoose"
import { Document } from "mongoose";

export interface CourseDetails {
  courseName: string;
  instructorName: string;
  coursePrice: number;
  offerPrice?: number;
  discountedPrice: number;
  adminShare: number;
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
    offerPrice?: number;
    instructorId: Types.ObjectId;
  }>;
  coupon?: {
    couponName: string;
    discountAmount: number;
  };
}

export interface InstructorDocument {
  _id: Types.ObjectId;
  username: string;
}