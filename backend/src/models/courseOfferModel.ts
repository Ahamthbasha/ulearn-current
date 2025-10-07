import { Schema, model, Document, Types } from "mongoose";

export interface ICourseOffer extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  instructorId: Types.ObjectId;
  discountPercentage: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isVerified: boolean;
  status: "pending" | "approved" | "rejected";
  reviews?: string;
  createdAt: Date;
  updatedAt: Date;
  discountedPrice?:number;
}

const CourseOfferSchema = new Schema<ICourseOffer>({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true, validate: {
    validator(this: ICourseOffer, val: Date) { return val > this.startDate; },
    message: "End date must be after start date"
  }},
  isActive: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reviews: { type: String, default: "" },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


CourseOfferSchema.virtual("discountedPrice").get(function(this: ICourseOffer) {
  return this.populated("courseId") ?
    (this.courseId as any).price * (1 - this.discountPercentage / 100) : null;
});

export const CourseOfferModel = model<ICourseOffer>("CourseOffer", CourseOfferSchema);
