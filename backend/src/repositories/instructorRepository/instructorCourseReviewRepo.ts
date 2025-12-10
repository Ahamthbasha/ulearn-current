import { Types, PipelineStage } from "mongoose";
import { CourseReviewModel, ICourseReview } from "../../models/courseReviewModel";
import { IInstructorCourseReviewRepo } from "./interface/IInstructorCourseReviewRepo";
import { GenericRepository } from "../genericRepository";
import { IPaginationResultReview } from "../../types/IPagination";
import { ICourseRepository } from "../interfaces/ICourseRepository";
import { format } from "date-fns";
import { IFormattedReview } from "../../dto/instructorDTO/reviewDTO";

export class InstructorCourseReviewRepo
  extends GenericRepository<ICourseReview>
  implements IInstructorCourseReviewRepo
{
  private _courseRepo: ICourseRepository;
  constructor(courseRepo: ICourseRepository) {
    super(CourseReviewModel);
    this._courseRepo = courseRepo;
  }

async getReviewsByCourseId(
  instructorId: Types.ObjectId,
  courseId: Types.ObjectId,
  page: number,
  limit: number,
  filter: { status?: "all" | "pending" | "approved" | "rejected" | "deleted" } = {},
  search?: string
): Promise<IPaginationResultReview<IFormattedReview>> {
  const isOwner = await this.isCourseOwnedByInstructor(courseId, instructorId);
  if (!isOwner) throw new Error("Unauthorized: You do not own this course");

  const match: any = { courseId };
  if (filter.status && filter.status !== "all") {
    match.status = filter.status;
  }

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
  ];

  if (search?.trim()) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    pipeline.push({
      $match: {
           reviewText: { $regex: escaped, $options: "i" } 
      },
    });
  }

  pipeline.push(
    {
      $project: {
        rating: 1,
        reviewText: 1,
        createdAt: 1,
        flaggedByInstructor: 1,
        rejectionReason: 1,
        status: 1,
        "student.username": 1,
        _id: 1,
      },
    },
    { $sort: { createdAt: -1 } }
  );

  const { data, total } = await this.paginateWithAggregation(pipeline, page, limit);

  const formatted: IFormattedReview[] = data.map((d: any) => ({
    ...d,
    _id: d._id.toString(),
    createdAt: format(new Date(d.createdAt), "dd-MM-yyyy hh:mm a"),
    rejectionReason: d.rejectionReason ?? null,
  }));

  return { data: formatted, total, page, limit };
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
      status:"pending"
    } as Partial<ICourseReview>);
  }

  async isCourseOwnedByInstructor(
    courseId: Types.ObjectId,
    instructorId: Types.ObjectId
  ): Promise<boolean> {
    return (await this._courseRepo.countDocuments({ _id: courseId, instructorId })) > 0;
  }

  async getCourseRatingStats(courseId: string) {
    const objId = new Types.ObjectId(courseId);
    const stats = await CourseReviewModel.aggregate([
      { $match: { courseId: objId, isDeleted: false, status: "approved" } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    const counts = [0, 0, 0, 0, 0];
    stats.forEach((s) => (counts[s._id - 1] = s.count));

    const course = await this._courseRepo.findById(courseId);
    return {
      ratingCounts: { "1": counts[0], "2": counts[1], "3": counts[2], "4": counts[3], "5": counts[4] },
      averageRating: course?.averageRating ?? 0,
    };
  }
}