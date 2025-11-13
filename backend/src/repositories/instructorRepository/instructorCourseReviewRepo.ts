// src/repositories/instructorRepository/instructorCourseReviewRepo.ts
import { Types, PipelineStage } from "mongoose";
import { CourseModel } from "../../models/courseModel";
import { CourseReviewModel, ICourseReview } from "../../models/courseReviewModel";
import { IInstructorCourseReviewRepo } from "./interface/IInstructorCourseReviewRepo";
import { GenericRepository } from "../genericRepository";
import { IPaginationResultReview } from "../../types/IPagination";

export class InstructorCourseReviewRepo
  extends GenericRepository<ICourseReview>
  implements IInstructorCourseReviewRepo
{
  constructor() {
    super(CourseReviewModel);
  }

  async getReviewsByCourseId(
    instructorId: Types.ObjectId,
    courseId: Types.ObjectId,
    page: number,
    limit: number,
    filter: { flagged?: boolean; approved?: boolean } = {}
  ): Promise<IPaginationResultReview<ICourseReview>> {
    // Ensure course belongs to instructor
    const isOwner = await this.isCourseOwnedByInstructor(courseId, instructorId);
    if (!isOwner) {
      throw new Error("Unauthorized: You do not own this course");
    }

    const matchStage: PipelineStage.Match = {
      $match: {
        courseId,
        isDeleted: false,
        ...filter,
      },
    };

    const lookupStage: PipelineStage.Lookup = {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    };

    const unwindStage: PipelineStage.Unwind = {
      $unwind: { path: "$student", preserveNullAndEmptyArrays: true },
    };

    const projectStage: PipelineStage.Project = {
      $project: {
        rating: 1,
        reviewText: 1,
        createdAt: 1,
        approved: 1,
        flaggedByInstructor: 1,
        "student.name": 1,
        "student.profileImage": 1,
      },
    };

    const sortStage: PipelineStage.Sort = {
      $sort: { createdAt: -1 },
    };

    const pipeline: PipelineStage[] = [
      matchStage,
      lookupStage,
      unwindStage,
      projectStage,
      sortStage,
    ];

    const { data, total } = await this.paginateWithAggregation(pipeline, page, limit);

    return { data, total, page, limit };
  }

  async flagReview(
    reviewId: Types.ObjectId,
    instructorId: Types.ObjectId
  ): Promise<ICourseReview | null> {
    const review = await this.findById(reviewId.toHexString());
    if (!review) return null;

    const isOwner = await this.isCourseOwnedByInstructor(review.courseId, instructorId);
    if (!isOwner) return null;

    return this.update(reviewId.toHexString(), {
      flaggedByInstructor: true,
    } as Partial<ICourseReview>);
  }

  async isCourseOwnedByInstructor(
    courseId: Types.ObjectId,
    instructorId: Types.ObjectId
  ): Promise<boolean> {
    const count = await CourseModel.countDocuments({
      _id: courseId,
      instructorId,
    }).exec();
    return count > 0;
  }
}