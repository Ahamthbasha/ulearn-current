import { Types } from "mongoose";
import { ILearningPath } from "../../../models/learningPathModel";
import { IGenericRepository } from "../../../repositories/genericRepository";

export interface IStudentLmsRepo extends IGenericRepository<ILearningPath> {
  getLearningPaths(
    query?: string,
    page?: number,
    limit?: number,
    category?: string,
    sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc"
  ): Promise<{ paths: ILearningPath[]; total: number }>;
  getLearningPathById(pathId: Types.ObjectId): Promise<ILearningPath | null>;
}