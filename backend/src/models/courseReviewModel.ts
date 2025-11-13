// models/courseReviewModel.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ICourseReview extends Document {
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
  approved: boolean;
  flaggedByInstructor: boolean;
  instructorResponse?: string;
  isDeleted?: boolean; // soft delete
}

const CourseReviewSchema = new Schema<ICourseReview>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    reviewText: { type: String, required: true, minlength: 10, maxlength: 1000 },
    approved: { type: Boolean, default: true }, // auto-approved
    flaggedByInstructor: { type: Boolean, default: false },
    instructorResponse: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CourseReviewSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

export const CourseReviewModel = model<ICourseReview>("CourseReview", CourseReviewSchema);