import { ILearningPath } from "../../../models/learningPathModel";

export interface IAdminLearningPathRepository {
  getSubmittedLearningPaths(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: ILearningPath[]; total: number }>;
  getLearningPathById(learningPathId: string): Promise<ILearningPath | null>;
  verifyLearningPath(learningPathId: string, status: "accepted" | "rejected", adminReview: string): Promise<ILearningPath | null>;
}