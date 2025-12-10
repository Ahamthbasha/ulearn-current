import { ICourseReview } from "../../../models/courseReviewModel";

export interface IStudentCourseReviewService {
  createReview(studentId: string, reviewData: { courseId: string; rating: number; reviewText: string },
    enrollment:{completionPercentage:number}
  ): Promise<ICourseReview>
  updateReview(studentId: string, reviewId: string, updates: Partial<ICourseReview>): Promise<ICourseReview | null>;
  deleteReview(studentId: string, reviewId: string): Promise<ICourseReview | null>;
  getMyReviews(studentId: string): Promise<ICourseReview[]>;
  getMyReviewForCourse(studentId: string, courseId: string): Promise<ICourseReview | null>;
}
