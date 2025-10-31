import { FilterQuery } from "mongoose";
import {
  LearningPathModel,
  ILearningPath,
  CreateLearningPathDTO,
} from "../../models/learningPathModel";
import { GenericRepository } from "../genericRepository";
import { IStudentLearningPathRepository } from "./interface/IStudentsideLMSRepo";

export class StudentLearningPathRepository
  extends GenericRepository<ILearningPath>
  implements IStudentLearningPathRepository
{
  constructor() {
    super(LearningPathModel);
  }

  async createLearningPath(
    data: CreateLearningPathDTO,
  ): Promise<ILearningPath> {
    return await this.create(data);
  }

  async updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
  ): Promise<ILearningPath | null> {
    return await this.update(learningPathId, data);
  }

  async deleteLearningPath(
    learningPathId: string,
  ): Promise<ILearningPath | null> {
    return await this.delete(learningPathId);
  }

  async getLearningPathById(
    learningPathId: string,
  ): Promise<ILearningPath | null> {
    const result = await this.findByIdWithPopulate(learningPathId, [
      {
        path: "items.courseId",
        select: "courseName thumbnailUrl price effectivePrice",
      },
      {
        path: "categoryDetails",
        select: "categoryName",
      },
    ]);
    return result;
  }

  async getLearningPathsByStudentWithPagination(
    studentId: string,
    page: number,
    limit: number,
    search: string = "",
  ): Promise<{ data: ILearningPath[]; total: number }> {
    const filter: FilterQuery<ILearningPath> = { studentId };

    if (search) {
      filter.title = { $regex: new RegExp(search, "i") };
    }

    const result = await this.paginate(filter, page, limit, { createdAt: -1 }, [
      {
        path: "items.courseId",
        select: "courseName thumbnailUrl price effectivePrice",
      },
      {
        path: "categoryDetails",
        select: "categoryName",
      },
    ]);

    return result;
  }

  async findLearningPathByTitleForStudent(
    title: string,
    studentId: string,
  ): Promise<ILearningPath | null> {
    return await this.findOne({ title, studentId });
  }

  async findLearningPathByTitleForStudentExcludingId(
    title: string,
    studentId: string,
    excludeId: string,
  ): Promise<ILearningPath | null> {
    return await this.findOne({
      title,
      studentId,
      _id: { $ne: excludeId },
    });
  }
}