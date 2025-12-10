import { Types, PipelineStage } from "mongoose";
import { CourseReviewModel, ICourseReview } from "../../models/courseReviewModel";
import { IAdminCourseReviewRepo } from "./interface/IAdminCourseReviewRepo";
import { GenericRepository } from "../genericRepository";
import { IPaginationResultReview } from "../../types/IPagination";
import { IAdminReviewDTO,RawReviewDoc } from "../../dto/adminDTO/adminReviewDTO";
import { format } from "date-fns";
import { IAdminUserRepository } from "./interface/IAdminUserRepository";

export class AdminCourseReviewRepo
  extends GenericRepository<ICourseReview>
  implements IAdminCourseReviewRepo
{
  private readonly _adminUserRepo: IAdminUserRepository;

  constructor(adminUserRepo: IAdminUserRepository) {
    super(CourseReviewModel);
    this._adminUserRepo = adminUserRepo;
  }

  private buildPipeline(match: Record<string, unknown>): PipelineStage[] {
    return [
      { $match: match  },
      {
        $project: {
          _id: 1,
          courseId: 1,
          studentId: 1,
          rating: 1,
          reviewText: 1,
          createdAt: 1,
          flaggedByInstructor: 1,
          isDeleted: 1,
          rejectionReason: 1,
          status:1
        },
      },
      { $sort: { flaggedByInstructor: -1, createdAt: -1 } },
    ];
  }

async getAllReviews(
  courseId: string, 
  page: number,
  limit: number,
  search?: string,
  status?: string
): Promise<IPaginationResultReview<IAdminReviewDTO>> {

  if (!courseId) {
    throw new Error("courseId is required");
  }

  const match: Record<string, unknown> = {
    courseId: new Types.ObjectId(courseId),
  };

  if (search?.trim()) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.reviewText = { $regex: escaped, $options: "i" };
  }

  if (status === "deleted") {
    match.isDeleted = true;
  } else if (status === "pending") {
    match.$or = [
      { status: "pending" },
      { flaggedByInstructor: true, status: { $ne: "rejected" } }
    ];
    match.isDeleted = false;
  } else if (status === "approved") {
    match.status = "approved";
    match.isDeleted = false;
  } else if (status === "rejected") {
    match.status = "rejected";
    match.isDeleted = false;
  }

  const pipeline = this.buildPipeline(match);
  const { data: rawData, total } = await this.paginateWithAggregation(pipeline, page, limit);
  const reviews = rawData as RawReviewDoc[];

  const studentIds = reviews.map((r) => r.studentId);
  const users = await this._adminUserRepo.getUsersByIds(studentIds);
  const userMap = new Map(users.map((u) => [u._id.toString(), u.username]));

  const formatted: IAdminReviewDTO[] = reviews.map((doc) => ({
    _id: doc._id.toString(),
    courseId: doc.courseId.toString(),
    studentId: doc.studentId.toString(),
    studentName: userMap.get(doc.studentId.toString()) ?? "Deleted User",
    rating: doc.rating,
    reviewText: doc.reviewText,
    createdAt: format(new Date(doc.createdAt), "dd-MM-yyyy hh:mm a"),
    flaggedByInstructor: doc.flaggedByInstructor,
    isDeleted: doc.isDeleted,
    rejectionReason: doc.rejectionReason ?? null,
    status: doc.status,
  }));

  return { data: formatted, total, page, limit };
}

  async getReviewById(reviewId: string): Promise<IAdminReviewDTO | null> {
  if (!(reviewId)) return null;

  const pipeline: PipelineStage[] = [
    { $match: { _id: new Types.ObjectId(reviewId)} },
    {
      $project: {
        _id: 1,
        courseId: 1,
        studentId: 1,
        rating: 1,
        reviewText: 1,
        createdAt: 1,
        flaggedByInstructor: 1,
        isDeleted: 1,
        rejectionReason: 1,
        status: 1,
      },
    },
  ];

  const result = await this.aggregate<RawReviewDoc>(pipeline);
  if (!result.length) return null;

  const doc = result[0];
  const users = await this._adminUserRepo.getUsersByIds([doc.studentId]);
  const username = users[0]?.username ?? "Deleted User";

  return {
    _id: doc._id.toString(),
    courseId: doc.courseId.toString(),
    studentId: doc.studentId.toString(),
    studentName: username,
    rating: doc.rating,
    reviewText: doc.reviewText,
    createdAt: format(new Date(doc.createdAt), "dd-MM-yyyy hh:mm a"),
    flaggedByInstructor: doc.flaggedByInstructor,
    isDeleted: doc.isDeleted,
    rejectionReason: doc.rejectionReason ?? null,
    status: doc.status,
  };
}

  async rejectReview(reviewId: string, reason: string): Promise<ICourseReview | null> {
    return this.update(reviewId, {
      rejectionReason: reason.trim(),
      flaggedByInstructor:false,
      status:"rejected"
    } as Partial<ICourseReview>);
  }

  async deleteReview(reviewId: string): Promise<ICourseReview | null> {
  return this.update(reviewId, 
    { isDeleted: true,status:"deleted"} as Partial<ICourseReview>);
  }

  async approveReview(reviewId: string): Promise<ICourseReview | null> {
  return this.update(reviewId, {
    flaggedByInstructor: false,
    rejectionReason:null,
    isDeleted:true,
    status:"deleted"
  } as Partial<ICourseReview>);
}
}