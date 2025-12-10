import { IFormattedReview } from "../../../dto/instructorDTO/reviewDTO";

import { IPaginationResultReview } from "../../../types/IPagination"; 

export interface IInstructorCourseReviewService {
  getCourseReviews(
    instructorId: string,
    courseId: string,
    page: number,
    limit: number,
    filter?: { status?: "all" | "pending" | "approved" | "rejected" | "deleted" },
    search?: string
  ): Promise<IPaginationResultReview<IFormattedReview>>;

  flagReview(
    instructorId: string,
    reviewId: string
  ): Promise<{ success: boolean; message: string }>;

  getCourseReviewStats(
    instructorId: string,
    courseId: string
  ): Promise<{ ratingCounts: Record<string, number>; averageRating: number }>;

}