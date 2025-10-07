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
        $lookup: {
          from: "courses",
          localField: "items.courseId",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $unwind: {
          path: "$items",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "items.courseId": {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$courseDetails",
                  as: "course",
                  cond: { $eq: ["$$course._id", "$items.courseId"] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $match: {
          "items.courseId": { $ne: null },
        },
      },
      {
        $lookup: {
          from: "offers",
          localField: "items.courseId.offer",
          foreignField: "_id",
          as: "items.courseId.offer",
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
            },
          },
          totalAmount: { $first: "$totalAmount" },
          isPublished: { $first: "$isPublished" },
          publishDate: { $first: "$publishDate" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          status: { $first: "$status" },
          adminReview: { $first: "$adminReview" },
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
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          instructorId: {
            _id: "$instructorId._id",
            username: "$instructorId.username",
          },
          items: 1,
          totalAmount: 1,
          isPublished: 1,
          publishDate: 1,
          createdAt: 1,
          updatedAt: 1,
          status: 1,
          adminReview: 1,
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
    return await this.findByIdWithPopulate(learningPathId, [
      {
        path: "items.courseId",
        select: "courseName thumbnailUrl price isVerified offer",
        populate: { path: "offer", select: "isActive startDate endDate discountPercentage" },
      },
      {
        path: "instructorId",
        select: "username",
      },
    ]);
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
    await this.update(learningPathId, { status, adminReview });
    
    return await this.findByIdWithPopulate(learningPathId, [
      {
        path: "items.courseId",
        select: "courseName thumbnailUrl price isVerified offer",
        populate: { path: "offer", select: "isActive startDate endDate discountPercentage" },
      },
      {
        path: "instructorId",
        select: "username",
      },
    ]);
  }
}