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
}

const CourseReviewSchema = new Schema<ICourseReview>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    reviewText: { type: String, required: true },
    approved: { type: Boolean, default: false },
    flaggedByInstructor: { type: Boolean, default: false },
    instructorResponse: { type: String },
  },
  { timestamps: true }
);

export const CourseReviewModel = model<ICourseReview>("CourseReview", CourseReviewSchema);
