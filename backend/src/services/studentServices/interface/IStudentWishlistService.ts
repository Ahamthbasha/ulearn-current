import { Types } from "mongoose";
import { IWishlist } from "../../../models/wishlistModel";
import { WishlistCourseDTO } from "../../../dto/userDTO/wishlistCourseDTO";

export interface IStudentWishlistService {
  addToWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<IWishlist>;
  removeFromWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<void>;
  getWishlistCourses(userId: Types.ObjectId): Promise<WishlistCourseDTO[]>;
  isCourseInWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<boolean>;
}