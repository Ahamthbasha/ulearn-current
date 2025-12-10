import { Types } from "mongoose";
import { ICourseReview } from "../../../models/courseReviewModel"; 
import { IPaginationResultReview } from "../../../types/IPagination";
import { IFormattedReview } from "../../../dto/instructorDTO/reviewDTO";

export interface IInstructorCourseReviewRepo {
  getReviewsByCourseId(
    instructorId: Types.ObjectId,
    courseId: Types.ObjectId,
    page: number,
    limit: number,
    filter?: { status?: "all" | "pending" | "approved" | "rejected" | "deleted" },
    search?: string
  ): Promise<IPaginationResultReview<IFormattedReview>>;

  flagReview(
    reviewId: Types.ObjectId,
    instructorId: Types.ObjectId
  ): Promise<ICourseReview | null>;

  getCourseRatingStats(
    courseId: string
  ): Promise<{ ratingCounts: Record<string, number>; averageRating: number }>;

  isCourseOwnedByInstructor(
    courseId: Types.ObjectId,
    instructorId: Types.ObjectId
  ): Promise<boolean>;
}