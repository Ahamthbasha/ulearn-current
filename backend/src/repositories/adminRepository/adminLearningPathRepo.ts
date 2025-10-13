import { ILearningPath } from "../../models/learningPathModel";
import { IAdminLearningPathRepository } from "./interface/IAdminLearningPathRepo";
import { LearningPathModel } from "../../models/learningPathModel";
import { GenericRepository } from "../genericRepository";
import { LearningPathErrorMessages } from "../../utils/constants";
import { PipelineStage } from "mongoose";

export class AdminLearningPathRepository
  extends GenericRepository<ILearningPath>
  implements IAdminLearningPathRepository
{
  constructor() {
    super(LearningPathModel);
  }

  async getSubmittedLearningPaths(
  page: number,
  limit: number,
  search: string = "",
  status: string = ""
): Promise<{ data: ILearningPath[]; total: number }> {
  const filter: any = {};

  if (search) {
    filter.title = { $regex: new RegExp(search, "i") };
  }

  if (status === "pending" || status === "accepted" || status === "rejected") {
    filter.status = status;
  }

  const sortOrder: PipelineStage.Sort = {
    $sort: {
      statusOrder: 1,
      createdAt: -1,
    },
  };

  const pipeline: PipelineStage[] = [
    ...(search || status ? [{ $match: filter }] : []),
    {
      $addFields: {
        statusOrder: {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "pending"] }, then: 1 },
              { case: { $eq: ["$status", "rejected"] }, then: 2 },
              { case: { $eq: ["$status", "accepted"] }, then: 3 },
            ],
            default: 4,
          },
        },
      },
    },
    sortOrder,
    {
      $unwind: {
        path: "$items",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "items.courseId",
        foreignField: "_id",
        as: "courseDetails",
      },
    },
    {
      $addFields: {
        "items.courseId": { $arrayElemAt: ["$courseDetails", 0] },
        "items.isVerified": {
          $ifNull: [{ $arrayElemAt: ["$courseDetails.isVerified", 0] }, false],
        },
      },
    },
    {
      $match: {
        "items.courseId": { $ne: null },
      },
    },
    {
      $group: {
        _id: "$_id",
        title: { $first: "$title" },
        description: { $first: "$description" },
        instructorId: { $first: "$instructorId" },
        items: {
          $push: {
            courseId: "$items.courseId",
            order: "$items.order",
            isVerified: "$items.isVerified",
          },
        },
        isPublished: { $first: "$isPublished" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        status: { $first: "$status" },
        adminReview: { $first: "$adminReview" },
        thumbnailUrl: { $first: "$thumbnailUrl" },
        category: { $first: "$category" },
        TotalCourseInLearningPath: { $sum: 1 },
        unverifiedCourseInLearningPath: {
          $sum: {
            $cond: [{ $eq: ["$items.isVerified", false] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: "instructors",
        localField: "instructorId",
        foreignField: "_id",
        as: "instructorId",
      },
    },
    {
      $unwind: {
        path: "$instructorId",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    {
      $unwind: {
        path: "$categoryDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        instructorId: {
          _id: "$instructorId._id",
          username: "$instructorId.username",
          email: "$instructorId.email",
        },
        items: 1,
        isPublished: 1,
        createdAt: 1,
        updatedAt: 1,
        status: 1,
        adminReview: 1,
        thumbnailUrl: 1,
        category: 1,
        categoryDetails: 1,
        TotalCourseInLearningPath: 1,
        unverifiedCourseInLearningPath: 1,
      },
    },
  ];

  const result = await this.paginateWithAggregation(pipeline, page, limit);

  return {
    data: result.data,
    total: result.total,
  };
}

  async getLearningPathById(learningPathId: string): Promise<ILearningPath | null> {
    const learningPath = await this.findByIdWithPopulate(learningPathId, [
      {
        path: "items.courseId",
        select: "courseName thumbnailUrl price isVerified",
      },
      {
        path: "instructorId",
        select: "username email",
      },
      {
        path: "categoryDetails",
        select: "categoryName isListed",
      },
    ]);

    return learningPath;
  }

  async verifyLearningPath(learningPathId: string, status: "accepted" | "rejected", adminReview: string): Promise<ILearningPath | null> {
    const learningPath = await this.findByIdWithPopulate(learningPathId, [
      {
        path: "items.courseId",
        select: "isVerified",
      },
    ]);
    if (!learningPath) return null;
    if (learningPath.status !== "pending") {
      throw new Error(LearningPathErrorMessages.NOT_SUBMITTED);
    }
    if (status === "accepted") {
      const unverifiedCourses = learningPath.items.filter(
        (item: any) => !item.courseId.isVerified
      );
      if (unverifiedCourses.length > 0) {
        throw new Error(LearningPathErrorMessages.UNVERIFIED_COURSES);
      }
    }
    await this.update(learningPathId, {
      status,
      adminReview,
      isPublished: status === "accepted" ? true : learningPath.isPublished,
    });

    return await this.getLearningPathById(learningPathId);
  }
}