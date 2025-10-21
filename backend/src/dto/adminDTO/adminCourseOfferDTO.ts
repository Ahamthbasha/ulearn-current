import { Types } from "mongoose";
import { ICourseOffer } from "../../models/courseOfferModel";

export interface ICourseOfferListDTO {
  offerId: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  discount: number;
  status: "pending" | "approved" | "rejected";
}

export interface ICourseOfferDetailDTO {
  courseOfferId: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  discount: number;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  review: string;
  coursePrice : number;
  discountedPrice : number;
  courseVerified:boolean;
}

interface PopulatedCourse {
  _id: Types.ObjectId;
  courseName: string;
  price: number;
  isVerified:boolean
}

interface PopulatedInstructor {
  _id: Types.ObjectId;
  username?: string;
  email: string;
}

export interface PopulatedCourseOffer extends Omit<ICourseOffer, "courseId" | "instructorId"> {
  courseId: PopulatedCourse;
  instructorId: PopulatedInstructor;
}