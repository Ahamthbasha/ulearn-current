import { Types } from "mongoose";
export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string;
  studentName: string;
  createdAt: string;
  flagged: boolean;
}


export interface IFormattedReview {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: string;     
  updatedAt: Date;
  flaggedByInstructor: boolean;
  rejectionReason?: string | null;
  isDeleted?: boolean;
  student?: { username: string };
  status:"pending" | "approved" | "rejected"
}



interface StudentInfo {
  username: string;
}

export interface ReviewAggregationResult {
  _id: Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: Date;
  approved: boolean;
  flaggedByInstructor: boolean;
  student?: StudentInfo | null;
}