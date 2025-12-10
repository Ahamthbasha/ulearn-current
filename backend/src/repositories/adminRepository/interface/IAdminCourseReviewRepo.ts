import { ICourseReview } from "../../../models/courseReviewModel";
import { IPaginationResultReview } from "../../../types/IPagination";
import { IAdminReviewDTO } from "../../../dto/adminDTO/adminReviewDTO";

export interface IAdminCourseReviewRepo {
  getAllReviews(
    courseId: string,
    page: number,
    limit: number,
    search?: string,
    status?:string
  ): Promise<IPaginationResultReview<IAdminReviewDTO>>;

  deleteReview(reviewId: string): Promise<ICourseReview | null>

  rejectReview(reviewId: string, reason: string): Promise<ICourseReview | null>;

  approveReview(reviewId: string): Promise<ICourseReview | null>

  getReviewById(reviewId: string): Promise<IAdminReviewDTO | null>;
}