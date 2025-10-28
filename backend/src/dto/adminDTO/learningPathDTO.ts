import { Types } from "mongoose";
import { ICourseOffer } from "../../models/courseOfferModel"; // Updated to use CourseOffer model

export interface PopulatedCourse {
  _id: Types.ObjectId;
  courseName?: string;
  thumbnailUrl?: string;
  price?: number;
  effectivePrice?: number;
  isVerified?: boolean;
  offer?: ICourseOffer | null; // Reference the full ICourseOffer interface
}

export interface LearningPathItemDTO {
  courseId: string;
  order: number;
  courseName?: string;
  thumbnailUrl?: string;
  price?: number;
  isVerified?: boolean;
}

export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName?: string;
  instructorEmail?: string;
  items: LearningPathItemDTO[];
  totalPrice: number;
  isPublished: boolean;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "accepted" | "rejected" | "draft";
  adminReview?: string;
  thumbnailUrl?: string;
  categoryId: string;
  categoryName?: string;
}
