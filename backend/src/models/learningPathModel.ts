import { Schema, model, Document, Types } from "mongoose";
import { CourseModel } from "./courseModel";
import { ICourse } from "./courseModel";
import { ICategoryModel } from "./categoryModel";
import { CourseOfferModel, ICourseOffer } from "./courseOfferModel";
import { appLogger } from "../utils/logger";

export interface ILearningPathItem {
  courseId: Types.ObjectId | ICourse;
  order: number;
}

export interface ILearningPath extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  studentId: Types.ObjectId;
  student?: { username: string; email: string };
  items: ILearningPathItem[];
  isPurchased: boolean;
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string;
  category: Types.ObjectId | ICategoryModel;
  categoryDetails?: ICategoryModel;
  courses?: ICourse[];
  totalPrice: number;
}

export interface CreateLearningPathDTO {
  title: string;
  description: string;
  studentId: Types.ObjectId;
  items: ILearningPathItem[];
  thumbnailUrl: string;
  category: Types.ObjectId;
}

const LearningPathItemSchema = new Schema<ILearningPathItem>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    order: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const LearningPathSchema = new Schema<ILearningPath>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [LearningPathItemSchema],
    isPurchased: { type: Boolean, default: false },
    thumbnailUrl: { type: String, required: false },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

LearningPathSchema.index({ studentId: 1, title: 1 }, { unique: true });
LearningPathSchema.index({ category: 1 });

LearningPathSchema.pre("save", async function (next) {
  const orders = this.items.map((item) => item.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    return next(new Error("Duplicate orders in learning path items"));
  }

  const courseIds = this.items.map((item) =>
    (item.courseId instanceof Types.ObjectId
      ? item.courseId
      : item.courseId._id
    ).toString(),
  );
  const uniqueCourseIds = new Set(courseIds);
  if (courseIds.length !== uniqueCourseIds.size) {
    return next(new Error("Duplicate courses in learning path"));
  }

  try {
    const categoryExists = await model("Category")
      .findById(this.category)
      .lean();
    if (!categoryExists) {
      return next(new Error("Invalid category ID"));
    }

    const courses = await CourseModel.find({
      _id: { $in: courseIds },
      isPublished: true,
    }).lean();
    if (courses.length !== courseIds.length) {
      return next(
        new Error("One or more courses are invalid or not published"),
      );
    }
  } catch (error) {
    appLogger.error("learningPath model error", error);
    return next(new Error("Failed to validate category or courses"));
  }

  next();
});

LearningPathSchema.virtual("courses", {
  ref: "Course",
  localField: "items.courseId",
  foreignField: "_id",
  justOne: false,
});

LearningPathSchema.virtual("categoryDetails", {
  ref: "Category",
  localField: "category",
  foreignField: "_id",
  justOne: true,
});

LearningPathSchema.virtual("student", {
  ref: "User",
  localField: "studentId",
  foreignField: "_id",
  justOne: true,
});

LearningPathSchema.virtual("totalPrice").get(async function (
  this: ILearningPath,
) {
  if (!this.courses || !Array.isArray(this.courses)) {
    await this.populate("courses");
  }

  const courseIds = this.courses?.map((course) => course._id.toString()) || [];
  if (courseIds.length === 0) {
    return 0;
  }

  const offers = await CourseOfferModel.find({
    courseId: { $in: courseIds.map((id) => new Types.ObjectId(id)) },
    isActive: true,
    isVerified: true,
    status: "approved",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  }).lean();

  const offerMap = new Map<string, ICourseOffer>(
    offers.map((offer) => [offer.courseId.toString(), offer]),
  );

  let totalPrice = 0;
  for (const course of this.courses || []) {
    const courseId = course._id.toString();
    const offer = offerMap.get(courseId);
    const price = offer
      ? course.price * (1 - offer.discountPercentage / 100)
      : (course.effectivePrice ?? course.price);
    totalPrice += price;
  }

  return totalPrice;
});

export const LearningPathModel = model<ILearningPath>(
  "LearningPath",
  LearningPathSchema,
);