import { IStudentWishlistService } from "./interface/IStudentWishlistService"; 
import { IStudentWishlistRepository } from "../../repositories/studentRepository/interface/IStudentWishlistRepository";
import { IWishlist } from "../../models/wishlistModel";
import { ICourse } from "../../models/courseModel";
import { WishlistCourseDTO } from "../../dto/userDTO/wishlistCourseDTO";
import { mapWishlistToDTO } from "../../mappers/userMapper/wishlistMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { Types } from "mongoose";

export class StudentWishlistService implements IStudentWishlistService {
    private _wishlistRepository: IStudentWishlistRepository
  constructor(wishlistRepository: IStudentWishlistRepository) {
    this._wishlistRepository = wishlistRepository
  }

  async addToWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<IWishlist> {
    return this._wishlistRepository.addToWishlist(userId, courseId);
  }

  async removeFromWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<void> {
    return this._wishlistRepository.removeFromWishlist(userId, courseId);
  }

  async getWishlistCourses(userId: Types.ObjectId): Promise<WishlistCourseDTO[]> {
    const wishlist = await this._wishlistRepository.getWishlistCourses(userId);

    // Generate presigned URLs for thumbnails
    for (const item of wishlist) {
      const course = item.courseId as ICourse;
      if (course?.thumbnailUrl) {
        course.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
      }
    }

    // Map to DTO and return
    return mapWishlistToDTO(wishlist);
  }

  async isCourseInWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<boolean> {
    return this._wishlistRepository.isCourseInWishlist(userId, courseId);
  }
}