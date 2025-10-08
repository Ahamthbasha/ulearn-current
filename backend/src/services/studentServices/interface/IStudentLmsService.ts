
import { ILearningPath } from "../../../models/learningPathModel"; 

export interface IStudentLmsService {
  getLearningPaths(
    query?: string,
    page?: number,
    limit?: number,
    category?: string
  ): Promise<{ paths: ILearningPath[]; total: number }>;

  getLearningPathById(pathId: string): Promise<ILearningPath | null>;
}