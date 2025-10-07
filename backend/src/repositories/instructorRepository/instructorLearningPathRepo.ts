import { LearningPathModel, ILearningPath, CreateLearningPathDTO } from "../../models/learningPathModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorLearningPathRepository } from "./interface/IInstructorLearningPathRepo";
import { CourseModel } from "../../models/courseModel";
import mongoose from "mongoose";
import { Types } from "mongoose";

export class InstructorLearningPathRepository
  extends GenericRepository<ILearningPath>
  implements IInstructorLearningPathRepository
{
  constructor() {
    super(LearningPathModel);
  }

  async createLearningPath(data: CreateLearningPathDTO): Promise<ILearningPath> {
    return await this.create(data);
  }

  async updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
  ): Promise<ILearningPath | null> {
    return await this.update(learningPathId, data);
  }

  async deleteLearningPath(learningPathId: string): Promise<ILearningPath | null> {
    return await this.delete(learningPathId);
  }

  async getLearningPathById(learningPathId: string): Promise<ILearningPath | null> {
    const result = await this.findByIdWithPopulate(learningPathId, {
      path: "items.courseId",
      select: "courseName thumbnailUrl price offer",
      populate: { path: "offer", select: "isActive startDate endDate discountPercentage" },
    });
    return result;
  }

  async getLearningPathsByInstructorWithPagination(
    instructorId: string,
    page: number,
    limit: number,
    search: string = "",
    status: string = "",
  ): Promise<{ data: ILearningPath[]; total: number }> {
    const filter: any = { instructorId };

    if (search) {
      filter.title = { $regex: new RegExp(search, "i") };
    }

    if (status) {
      if (status === "published") {
        filter.isPublished = true;
      } else if (status === "unpublished") {
        filter.isPublished = false;
      } else if (["pending", "accepted", "rejected", "draft"].includes(status)) {
        filter.status = status; // Filter by status
      }
    }

    return await this.paginate(
      filter,
      page,
      limit,
      { createdAt: -1 },
      {
        path: "items.courseId",
        select: "courseName thumbnailUrl price offer",
        populate: { path: "offer", select: "isActive startDate endDate discountPercentage" },
      },
    );
  }

  async findLearningPathByTitleForInstructor(
    title: string,
    instructorId: string,
  ): Promise<ILearningPath | null> {
    return await this.findOne({ title, instructorId });
  }

  async findLearningPathByTitleForInstructorExcludingId(
    title: string,
    instructorId: string,
    excludeId: string,
  ): Promise<ILearningPath | null> {
    return await this.findOne({
      title,
      instructorId,
      _id: { $ne: excludeId },
    });
  }

  async publishLearningPath(learningPathId: string): Promise<ILearningPath | null> {
    const updateData: Partial<ILearningPath> = { isPublished: true };
    return await this.update(learningPathId, updateData);
  }

  async validateCoursesForInstructor(courses: Types.ObjectId[], instructorId: string): Promise<boolean> {
    const count = await CourseModel.countDocuments({
      _id: { $in: courses },
      instructorId: new mongoose.Types.ObjectId(instructorId),
      isPublished: true,
    });
    return count === courses.length;
  }
}