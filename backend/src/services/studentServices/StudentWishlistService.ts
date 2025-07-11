import { IStudentWishlistService } from "../interface/IStudentWishlistService";
import { IStudentWishlistRepository } from "../../repositories/interfaces/IStudentWishlistRepository";
import { IWishlist } from "../../models/wishlistModel";
import { Types } from "mongoose";

export class StudentWishlistService implements IStudentWishlistService {
    private wishlistRepository: IStudentWishlistRepository
  constructor(wishlistRepository: IStudentWishlistRepository) {
    this.wishlistRepository = wishlistRepository
  }

  async addToWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<IWishlist> {
    return this.wishlistRepository.addToWishlist(userId, courseId);
  }

  async removeFromWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<void> {
    return this.wishlistRepository.removeFromWishlist(userId, courseId);
  }

  async getWishlistCourses(userId: Types.ObjectId): Promise<IWishlist[]> {
    return await this.wishlistRepository.getWishlistCourses(userId);
  }

  async isCourseInWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<boolean> {
    return this.wishlistRepository.isCourseInWishlist(userId, courseId);
  }
}
