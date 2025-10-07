import { Schema, model, Document, Types } from "mongoose";

export interface ILearningPathItem {
  courseId: Types.ObjectId;
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
  status: "pending" | "accepted" | "rejected" | "draft"; // New status field
  adminReview?: string; // Single review instead of array
}

export interface CreateLearningPathDTO {
  title: string;
  description: string;
  instructorId: Types.ObjectId;
  items: ILearningPathItem[];
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
      default: "draft" 
    }, // New field
    adminReview: { type: String, required: false }, // Single review field
  },
  { timestamps: true },
);

LearningPathSchema.index({ instructorId: 1, title: 1 }, { unique: true });
LearningPathSchema.pre("save", function (next) {
  const orders = this.items.map((item) => item.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    return next(new Error("Duplicate orders in learning path items"));
  }
  const courseIds = this.items.map((item) => item.courseId.toString());
  const uniqueCourseIds = new Set(courseIds);
  if (courseIds.length !== uniqueCourseIds.size) {
    return next(new Error("Duplicate courses in learning path"));
  }
  next();
});

LearningPathSchema.virtual("courses", {
  ref: "Course",
  localField: "items.courseId",
  foreignField: "_id",
  justOne: false,
});

export const LearningPathModel = model<ILearningPath>("LearningPath", LearningPathSchema);