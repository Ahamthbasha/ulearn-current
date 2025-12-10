import { Types } from 'mongoose';

export interface ICourseRatingRepository {
  getApprovedReviewStats(courseId: Types.ObjectId): Promise<{ average: number; count: number }>;
  updateCourseRating(courseId: Types.ObjectId, average: number, count: number): Promise<void>;
}