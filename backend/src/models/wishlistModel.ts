import { Schema, model, Document, Types } from "mongoose";
import { ICourse } from "./courseModel";
import { ILearningPath } from "./learningPathModel";

// Updated Wishlist Interface and Schema
export interface IWishlist extends Document {
  userId: Types.ObjectId;
  courseId?: Types.ObjectId | ICourse;
  learningPathId?: Types.ObjectId | ILearningPath;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: false,
    },
    learningPathId: {
      type: Schema.Types.ObjectId,
      ref: "LearningPath",
      required: false,
    },
  },
  { timestamps: true },
);

// Ensure only one of courseId or learningPathId is set
wishlistSchema.pre("save", function (next) {
  if (this.courseId && this.learningPathId) {
    return next(new Error("Wishlist item cannot have both courseId and learningPathId"));
  }
  if (!this.courseId && !this.learningPathId) {
    return next(new Error("Wishlist item must have either courseId or learningPathId"));
  }
  next();
});

export const WishlistModel = model<IWishlist>("Wishlist", wishlistSchema);