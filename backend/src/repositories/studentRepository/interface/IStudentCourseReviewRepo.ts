import { ICourseReview } from "../../../models/courseReviewModel";

export interface IStudentCourseReviewRepo {

  createReview(review: Partial<ICourseReview>): Promise<ICourseReview>;
  updateReview(reviewId: string, updates: Partial<ICourseReview>): Promise<ICourseReview | null>;
  deleteReview(reviewId: string): Promise<ICourseReview | null>;
  getReviewsByStudent(studentId: string): Promise<ICourseReview[]>;
  getReviewByStudentForCourse(studentId: string, courseId: string): Promise<ICourseReview | null>;
  findOne(filter: Partial<ICourseReview>): Promise<ICourseReview | null>;
}
