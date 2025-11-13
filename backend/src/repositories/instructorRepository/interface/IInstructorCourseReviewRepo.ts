import { Types } from "mongoose";
import { ICourseReview } from "../../../models/courseReviewModel"; 
import { IPaginationResultReview } from "../../../types/IPagination";

export interface IInstructorCourseReviewRepo {

  getReviewsByCourseId(
    instructorId: Types.ObjectId,
    courseId: Types.ObjectId,
    page: number,
    limit: number,
    filter?: { flagged?: boolean; approved?: boolean }
  ): Promise<IPaginationResultReview<ICourseReview>>;

  flagReview(
    reviewId: Types.ObjectId,
    instructorId: Types.ObjectId
  ): Promise<ICourseReview | null>;

  isCourseOwnedByInstructor(
    courseId: Types.ObjectId,
    instructorId: Types.ObjectId
  ): Promise<boolean>;
}