import { Types } from "mongoose";
import { IWishlist } from "../../models/wishlistModel";

export interface IStudentWishlistRepository {
  addToWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<IWishlist>;
  removeFromWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<void>;
  getWishlistCourses(userId: Types.ObjectId): Promise<IWishlist[]>;
  isCourseInWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<boolean>;
}
