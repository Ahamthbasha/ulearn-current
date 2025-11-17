import { IPaginationResultReview } from "../../../types/IPagination";
import { IAdminReviewDTO } from "../../../dto/adminDTO/adminReviewDTO";

export interface IAdminCourseReviewService {
  getAllReviews(
    courseId: string,
    page: number,
    limit: number,
    search?: string,
    status?:string
  ): Promise<IPaginationResultReview<IAdminReviewDTO>>;

  deleteReview(reviewId: string): Promise<{ success: boolean; message: string }>;

  rejectReview(reviewId: string, reason: string): Promise<{ success: boolean; message: string }>;

  approveReview(reviewId: string): Promise<{ success: boolean; message: string }>;

  getReviewById(reviewId: string): Promise<IAdminReviewDTO | null>;

}