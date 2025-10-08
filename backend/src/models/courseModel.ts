import { Schema, model, Document, Types } from "mongoose";
import { LearningPathModel, ILearningPathItem } from "./learningPathModel";

export interface IDemoVideo {
  type: "video";
  url: string;
}

export interface ICourse extends Document {
  _id: Types.ObjectId & { toString(): string };
  courseName: string;
  instructorId: Types.ObjectId;
  category: Types.ObjectId;
  quizId: Types.ObjectId;
  description: string;
  demoVideo: IDemoVideo;
  price: number;
  level: string;
  duration: string;
  thumbnailUrl: string;
  isPublished: boolean;
  isVerified: boolean;
  isListed: boolean;
  createdAt: Date;
  updatedAt: Date;
  offer?: Types.ObjectId;
  originalPrice?: number;
  effectivePrice?: number;
  publishDate?: Date;
}

const demoVideoSchema = new Schema<IDemoVideo>({
  type: { type: String, enum: ["video"], required: true },
  url: { type: String, required: true },
});

const CourseSchema = new Schema<ICourse>(
  {
    courseName: { type: String, required: true },
    instructorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Instructor",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: false,
    },
    description: { type: String, required: true },
    demoVideo: demoVideoSchema,
    price: { type: Number, required: true },
    level: { type: String, required: true },
    duration: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
    isListed: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    offer: {
      type: Schema.Types.ObjectId,
      ref: "CourseOffer",
      required: false,
    },
    publishDate: { type: Date, required: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CourseSchema.index({ courseName: "text" });

CourseSchema.pre("save", async function (next) {
  if (this.isModified("price") || this.isModified("offer")) {
    try {
      const learningPaths = await LearningPathModel.find({
        "items.courseId": this._id,
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

CourseSchema.virtual("chapters", {
  ref: "Chapter",
  localField: "_id",
  foreignField: "courseId",
  justOne: false,
});

CourseSchema.virtual("quizzes", {
  ref: "Quiz",
  localField: "_id",
  foreignField: "courseId",
  justOne: false,
});

CourseSchema.virtual("effectivePrice").get(function (this: ICourse) {
  if (this.offer && this.populated("offer")) {
    const offer = this.offer as any;
    if (offer.isActive && new Date() >= offer.startDate && new Date() <= offer.endDate) {
      return this.price * (1 - offer.discountPercentage / 100);
    }
  }
  return this.price;
});

export const CourseModel = model<ICourse>("Course", CourseSchema);