import { Types } from "mongoose";

export interface IAdminReviewDTO {
  _id: string;
  courseId: string;
  courseTitle?: string;
  studentId: string;
  studentName: string;
  rating: number;
  reviewText: string;
  createdAt: string; // formatted
  flaggedByInstructor: boolean;
  isDeleted: boolean;
  rejectionReason?: string | null;
  status:"pending"|"approved"|"rejected"
}


export interface RawReviewDoc {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: Date;
  flaggedByInstructor: boolean;
  isDeleted: boolean;
  rejectionReason?: string | null;
  status:"pending" | "approved" | "rejected"
}