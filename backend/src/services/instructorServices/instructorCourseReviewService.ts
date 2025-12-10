import { Types } from "mongoose";
import { IInstructorCourseReviewRepo } from "../../repositories/instructorRepository/interface/IInstructorCourseReviewRepo"; 
import { IInstructorCourseReviewService } from "./interface/IInstructorCourseReviewService";
import { IPaginationResultReview } from "../../types/IPagination";
import { IFormattedReview } from "../../dto/instructorDTO/reviewDTO";
import { ICourseRatingRepository } from "src/repositories/interfaces/ICourseRatingRepository";
import { appLogger } from "../../utils/logger";
export class InstructorCourseReviewService
  implements IInstructorCourseReviewService
{
  private _reviewRepo: IInstructorCourseReviewRepo
  private _ratingRepo: ICourseRatingRepository
  constructor(reviewRepo:IInstructorCourseReviewRepo,ratingRepo:ICourseRatingRepository) {
    this._reviewRepo = reviewRepo
    this._ratingRepo = ratingRepo
  }

  async getCourseReviews(
    instructorId: string,
    courseId: string,
    page: number,
    limit: number,
    filter?: { status?: "all" | "pending" | "approved" | "rejected" | "deleted"},
    search?:string
  ): Promise<IPaginationResultReview<IFormattedReview>> {
    const instructorObjId = new Types.ObjectId(instructorId);
    const courseObjId = new Types.ObjectId(courseId);

    const isOwner = await this._reviewRepo.isCourseOwnedByInstructor(
      courseObjId,
      instructorObjId
    );

    if (!isOwner) {
      throw new Error("Unauthorized: You do not own this course");
    }

    const result = this._reviewRepo.getReviewsByCourseId(
      instructorObjId,
      courseObjId,
      page,
      limit,
      filter,
      search
    );
    return result
  }

  async flagReview(
    instructorId: string,
    reviewId: string
  ): Promise<{ success: boolean; message: string }> {
    const instructorObjId = new Types.ObjectId(instructorId);
    const reviewObjId = new Types.ObjectId(reviewId);

    const updatedReview = await this._reviewRepo.flagReview(
      reviewObjId,
      instructorObjId
    );

    if (!updatedReview) {
      return { success: false, message: "Review not found or not authorized" };
    }

    await this.recalculateCourseRating(updatedReview.courseId)

    return { success: true, message: "Review flagged successfully" };
  }

async getCourseReviewStats(
  instructorId: string,
  courseId: string
): Promise<{ ratingCounts: Record<string, number>; averageRating: number }> {
  const instructorObjId = new Types.ObjectId(instructorId);
  const courseObjId = new Types.ObjectId(courseId);
  const isOwner = await this._reviewRepo.isCourseOwnedByInstructor(courseObjId, instructorObjId);
  if (!isOwner) {
    throw new Error("Unauthorized: You do not own this course");
  }
  return this._reviewRepo.getCourseRatingStats(courseId); 
}
 private async recalculateCourseRating(courseId: Types.ObjectId): Promise<void> {
    try {
      const stats = await this._ratingRepo.getApprovedReviewStats(courseId);
      
      await this._ratingRepo.updateCourseRating(courseId, stats.average, stats.count);
    } catch (error) {
      appLogger.error("Failed to recalculate course rating:", error);
    }
  }
}