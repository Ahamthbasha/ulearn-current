import { ICourseRatingRepository } from "../../repositories/interfaces/ICourseRatingRepository";
import { IAdminReviewDTO } from "../../dto/adminDTO/adminReviewDTO";
import { IAdminCourseReviewRepo } from "../../repositories/adminRepository/interface/IAdminCourseReviewRepo";
import { IAdminCourseReviewService } from "./interface/IAdminCourseReviewService";
import { appLogger } from "../../utils/logger";
import {Types} from "mongoose"
export class AdminCourseReviewService implements IAdminCourseReviewService {
  private _adminCourseReviewRepo: IAdminCourseReviewRepo;
  private _courseRatingRepo : ICourseRatingRepository
  constructor(adminCourseReviewRepo: IAdminCourseReviewRepo,courseRatingRepo:ICourseRatingRepository) {
    this._adminCourseReviewRepo = adminCourseReviewRepo;
    this._courseRatingRepo = courseRatingRepo
  }

  async getAllReviews( courseId: string,page: number, limit: number, search?: string,status?:string) {
    return this._adminCourseReviewRepo.getAllReviews(courseId,page, limit, search, status);
  }

  async deleteReview(reviewId: string) {
    const review = await this._adminCourseReviewRepo.deleteReview(reviewId);
    if (!review) {
      return { success: false, message: "Review not found" };
    }
    await this.recalculateCourseRating(review.courseId)
    return { success: true, message: "Review deleted successfully" }
  }

  async rejectReview(reviewId: string, reason: string): Promise<{ success: boolean; message: string }> {
    if (!reason?.trim()) {
      return { success: false, message: "Rejection reason is required" };
    }
    const review = await this._adminCourseReviewRepo.rejectReview(reviewId, reason.trim());
    if(!review){
      return { success: false, message: "Review not found" }
    }

    await this.recalculateCourseRating(review.courseId)

    return { success: true, message: "Review rejected. Instructor notified." };
  }

  async approveReview(reviewId: string) : Promise<{ success: boolean; message: string }>{
  const review = await this._adminCourseReviewRepo.approveReview(reviewId);
  if (!review) {
      return { success: false, message: "Review not found" };
    }
    await this.recalculateCourseRating(review.courseId);

    return { success: true, message: "Review approved" };
}

async getReviewById(reviewId: string): Promise<IAdminReviewDTO | null> {
  return this._adminCourseReviewRepo.getReviewById(reviewId);
}

private async recalculateCourseRating(courseId: Types.ObjectId): Promise<void> {
    try {
      const stats = await this._courseRatingRepo
      .getApprovedReviewStats(courseId);
      
      await this._courseRatingRepo.updateCourseRating(courseId, stats.average, stats.count);
      
      appLogger.info(`Course rating updated: ${courseId} -> avg: ${stats.average}, count: ${stats.count}`);
    } catch (error) {
      appLogger.error("Failed to recalculate course rating:", error);
    }
  }
}