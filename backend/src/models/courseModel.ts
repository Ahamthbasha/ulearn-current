import { Schema, model, Document, Types } from "mongoose";
import { IChapter } from "./chapterModel";
import { IQuiz } from "./quizModel";

export interface IDemoVideo {
  type: "video";
  url: string;
}

export interface IPopulatedCourse extends ICourse {
  chapters: IChapter[];
  quizzes: IQuiz[];
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
  isSubmitted:boolean;
  review:string;
  createdAt: Date;
  updatedAt: Date;
  originalPrice?: number;
  effectivePrice?: number;
  discountedPrice?:number;
  publishDate?: Date;
  Chapters?:IChapter[];
  quizzes?:IQuiz[];
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
    isSubmitted: { type: Boolean, default: false },
    review: { type: String, default: "" }, 
    publishDate: { type: Date, required: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CourseSchema.index({ courseName: "text" });

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


export const CourseModel = model<ICourse>("Course", CourseSchema);