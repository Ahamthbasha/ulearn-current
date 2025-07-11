import { Schema, model, Document, Types } from "mongoose";
import { ICourse } from "./courseModel";

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId | ICourse;
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
      required: true,
    },
  },
  { timestamps: true }
);

export const WishlistModel = model<IWishlist>("Wishlist", wishlistSchema);
