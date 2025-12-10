import { Schema, model, Document, Types } from "mongoose";

export interface ICourseReview extends Document {
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;
  rating: number;
  reviewText: string;
  createdAt: Date;
  updatedAt: Date;
  flaggedByInstructor: boolean;
  isDeleted?: boolean;
  rejectionReason?: string | null;
  status: "pending" | "approved" | "rejected" | "deleted";
}

const CourseReviewSchema = new Schema<ICourseReview>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    reviewText: { type: String, required: true, minlength: 10, maxlength: 1000 },
    flaggedByInstructor: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected","deleted"],
      default: "approved",
    },
  },
  { timestamps: true }
);

CourseReviewSchema.index({ courseId: 1, studentId: 1 }, { unique: true });


CourseReviewSchema.pre("save", function (next) {
  if (
    this.isModified("flaggedByInstructor") ||
    this.isModified("rejectionReason") ||
    this.isModified("isDeleted")
  ) {
    if (this.isDeleted) {
      this.status = "deleted";
    } else if (this.rejectionReason) {
      this.status = "rejected";
    } else if (this.flaggedByInstructor) {
      this.status = "pending";
    } else {
      this.status = "approved";
    }
  }
  next();
});

export const CourseReviewModel = model<ICourseReview>("CourseReview", CourseReviewSchema);