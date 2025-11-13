import { ICourseReview } from "../../../models/courseReviewModel";
import { IPaginationResultReview } from "../../../types/IPagination"; 

export interface IInstructorCourseReviewService {
  getCourseReviews(
    instructorId: string,
    courseId: string,
    page: number,
    limit: number,
    filter?: { flagged?: boolean; approved?: boolean }
  ): Promise<IPaginationResultReview<ICourseReview>>;

  flagReview(
    instructorId: string,
    reviewId: string
  ): Promise<{ success: boolean; message: string }>;
}