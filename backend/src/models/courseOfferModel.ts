import { Schema, model, Document, Types } from "mongoose";
import { CourseModel } from "./courseModel";
import { LearningPathModel, ILearningPathItem } from "./learningPathModel";

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
  discountedPrice?: number;
}

const CourseOfferSchema = new Schema<ICourseOffer>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator(this: ICourseOffer, val: Date) { return val > this.startDate; },
        message: "End date must be after start date",
      },
    },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviews: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CourseOfferSchema.pre("save", async function (next) {
  if (this.isModified("isActive") || this.isModified("startDate") || this.isModified("endDate") || this.isModified("discountPercentage")) {
    try {
      const course = await CourseModel.findById(this.courseId);
      if (!course) {
        return next(new Error("Course not found"));
      }
      const learningPaths = await LearningPathModel.find({
        "items.courseId": this.courseId,
      });
      for (const path of learningPaths) {
        const courses = await CourseModel.find({
          _id: { $in: path.items.map((item: ILearningPathItem) => item.courseId) },
        })
          .populate({
            path: "offer",
            select: "isActive startDate endDate discountPercentage",
          })
          .lean();
        path.totalPrice = courses.reduce((sum, course) => {
          const effectivePrice = course.effectivePrice ?? course.price;
          return sum + effectivePrice;
        }, 0);
        await path.save();
      }
      next();
    } catch (error) {
      next(new Error("Failed to update learning path prices"));
    }
  } else {
    next();
  }
});

CourseOfferSchema.virtual("discountedPrice").get(function (this: ICourseOffer) {
  return this.populated("courseId")
    ? (this.courseId as any).price * (1 - this.discountPercentage / 100)
    : null;
});

export const CourseOfferModel = model<ICourseOffer>("CourseOffer", CourseOfferSchema);