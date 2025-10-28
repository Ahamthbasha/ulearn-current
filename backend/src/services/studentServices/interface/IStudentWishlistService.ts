import { Types } from "mongoose";
import { IWishlist } from "../../../models/wishlistModel";
import { WishlistItemDTO } from "../../../dto/userDTO/wishlistCourseDTO";

export interface IStudentWishlistService {
  addToWishlist(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    type: "course" | "learningPath",
  ): Promise<IWishlist>;
  removeFromWishlist(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    type: "course" | "learningPath",
  ): Promise<void>;
  getWishlistItems(userId: Types.ObjectId): Promise<WishlistItemDTO[]>;
  isItemInWishlist(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    type: "course" | "learningPath",
  ): Promise<boolean>;
}
