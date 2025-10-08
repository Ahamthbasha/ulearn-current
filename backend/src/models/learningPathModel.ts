import { Schema, model, Document, Types } from "mongoose";
import { CourseModel } from "./courseModel";
import { ICourse } from "./courseModel";
import { ICategoryModel } from "./categoryModel";

export interface ILearningPathItem {
  courseId: Types.ObjectId | ICourse;
  order: number;
}

export interface ILearningPath extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  instructorId: Types.ObjectId;
  items: ILearningPathItem[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: "pending" | "accepted" | "rejected" | "draft";
  adminReview?: string;
  thumbnailUrl?: string;
  totalPrice: number;
  category: Types.ObjectId;
  categoryDetails?:ICategoryModel
}

export interface CreateLearningPathDTO {
  title: string;
  description: string;
  instructorId: Types.ObjectId;
  items: ILearningPathItem[];
  thumbnailUrl: string;
  category: Types.ObjectId;
}

const LearningPathItemSchema = new Schema<ILearningPathItem>({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  order: { type: Number, required: true, min: 1 },
}, { _id: false });

const LearningPathSchema = new Schema<ILearningPath>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    items: [LearningPathItemSchema],
    isPublished: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "pending", "accepted", "rejected"],
      default: "draft",
    },
    adminReview: { type: String, required: false },
    thumbnailUrl: { type: String, required: false },
    totalPrice: { type: Number, required: true, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

LearningPathSchema.index({ instructorId: 1, title: 1 }, { unique: true });

LearningPathSchema.pre("save", async function (next) {
  const orders = this.items.map((item) => item.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    return next(new Error("Duplicate orders in learning path items"));
  }

  const courseIds = this.items.map((item) => (item.courseId instanceof Types.ObjectId ? item.courseId : item.courseId._id).toString());
  const uniqueCourseIds = new Set(courseIds);
  if (courseIds.length !== uniqueCourseIds.size) {
    return next(new Error("Duplicate courses in learning path"));
  }

  try {
    const courses = await CourseModel.find({
      _id: { $in: this.items.map((item) => (item.courseId instanceof Types.ObjectId ? item.courseId : item.courseId._id)) },
    })
      .populate({
        path: "offer",
        select: "isActive startDate endDate discountPercentage",
      })
      .lean();

    this.totalPrice = courses.reduce((sum, course) => {
      const effectivePrice = course.effectivePrice ?? course.price;
      return sum + effectivePrice;
    }, 0);
  } catch (error) {
    return next(new Error("Failed to calculate total price"));
  }

  try {
    const categoryExists = await model("Category").findById(this.category).lean();
    if (!categoryExists) {
      return next(new Error("Invalid category ID"));
    }
  } catch (error) {
    return next(new Error("Failed to validate category"));
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

export const LearningPathModel = model<ILearningPath>("LearningPath", LearningPathSchema);