import { Types } from "mongoose";
import { ILearningPath } from "../../../models/learningPathModel"; 
export interface IStudentLmsRepo {
  getLearningPaths(
    query?: string,
    page?: number,
    limit?: number,
    category?: string
  ): Promise<{ paths: ILearningPath[]; total: number }>;
  getLearningPathById(pathId: Types.ObjectId): Promise<ILearningPath | null>;
}