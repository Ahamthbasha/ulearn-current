import { Types } from "mongoose";
import { ICourseReview } from "../../models/courseReviewModel";
import { IInstructorCourseReviewRepo } from "../../repositories/instructorRepository/interface/IInstructorCourseReviewRepo"; 
import { IInstructorCourseReviewService } from "./interface/IInstructorCourseReviewService";
import { IPaginationResultReview } from "../../types/IPagination";
export class InstructorCourseReviewService
  implements IInstructorCourseReviewService
{
  constructor(private readonly reviewRepo: IInstructorCourseReviewRepo) {}

  async getCourseReviews(
    instructorId: string,
    courseId: string,
    page: number,
    limit: number,
    filter?: { flagged?: boolean; approved?: boolean }
  ): Promise<IPaginationResultReview<ICourseReview>> {
    const instructorObjId = new Types.ObjectId(instructorId);
    const courseObjId = new Types.ObjectId(courseId);

    const isOwner = await this.reviewRepo.isCourseOwnedByInstructor(
      courseObjId,
      instructorObjId
    );

    if (!isOwner) {
      throw new Error("Unauthorized: You do not own this course");
    }

    return this.reviewRepo.getReviewsByCourseId(
      instructorObjId,
      courseObjId,
      page,
      limit,
      filter
    );
  }

  async flagReview(
    instructorId: string,
    reviewId: string
  ): Promise<{ success: boolean; message: string }> {
    const instructorObjId = new Types.ObjectId(instructorId);
    const reviewObjId = new Types.ObjectId(reviewId);

    const updatedReview = await this.reviewRepo.flagReview(
      reviewObjId,
      instructorObjId
    );

    if (!updatedReview) {
      return { success: false, message: "Review not found or not authorized" };
    }

    return { success: true, message: "Review flagged successfully" };
  }
}