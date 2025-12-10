import { Schema, model, Document, Types } from "mongoose";
import { IModulePopulated } from "./moduleModel";
import { IInstructorPopulated } from "./instructorModel";
import { ICategoryPopulated } from "./categoryModel";

export interface IDemoVideo {
  type: "video";
  url: string;
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  courseName: string;
  instructorId: Types.ObjectId;
  category: Types.ObjectId;
  description: string;
  demoVideo: IDemoVideo;
  price: number;
  level: string;
  duration: string;
  thumbnailUrl: string;
  isPublished: boolean;
  isVerified: boolean;
  isListed: boolean;
  isSubmitted: boolean;
  review: string;
  createdAt: Date;
  updatedAt: Date;
  originalPrice?: number;
  effectivePrice?: number;
  discountedPrice?: number;
  publishDate?: Date;
  modules?: IModulePopulated[];
  averageRating:number;
  totalRatings:number;
}

export interface ICourseFullyPopulated extends Omit<ICourse, "instructorId" | "category"> {
  instructorId: IInstructorPopulated;
  category: ICategoryPopulated;
  modules: IModulePopulated[];
}

const demoVideoSchema = new Schema<IDemoVideo>({
  type: { type: String, enum: ["video"], required: true },
  url: { type: String, required: true },
});

const CourseSchema = new Schema<ICourse>(
  {
    courseName: { type: String, required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, required: true },
    demoVideo: demoVideoSchema,
    price: { type: Number, required: true },
    level: { type: String, required: true },
    duration: { type: String, default: "0" },
    thumbnailUrl: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
    isListed: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isSubmitted: { type: Boolean, default: false },
    review: { type: String, default: "" },
    publishDate: { type: Date },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

CourseSchema.index({ courseName: "text" });

CourseSchema.virtual("modules", {
  ref: "Module",
  localField: "_id",
  foreignField: "courseId",
  justOne: false,
});

export const CourseModel = model<ICourse>("Course", CourseSchema);