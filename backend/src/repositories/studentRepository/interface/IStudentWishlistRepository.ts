import { Types } from "mongoose";
import { IWishlist } from "../../../models/wishlistModel";

export interface IStudentWishlistRepository {
  addToWishlist(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    type: "course" | "learningPath"
  ): Promise<IWishlist>;
  removeFromWishlist(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    type: "course" | "learningPath"
  ): Promise<void>;
  getWishlistItems(userId: Types.ObjectId): Promise<IWishlist[]>;
  isItemInWishlist(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    type: "course" | "learningPath"
  ): Promise<boolean>;
}