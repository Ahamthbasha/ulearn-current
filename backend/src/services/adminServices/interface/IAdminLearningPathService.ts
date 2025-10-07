import { LearningPathDTO } from "../../../dto/adminDTO/learningPathDTO";
import { LearningPathSummaryDTO } from "../../../dto/adminDTO/learningPathSummaryDTO";

export interface IAdminLearningPathService {
  getSubmittedLearningPaths(
    page: number,
    limit: number,
    search?: string,
    status?: string
  ): Promise<{ data: LearningPathSummaryDTO[]; total: number }>;
  getLearningPathById(learningPathId: string): Promise<LearningPathDTO | null>;
  verifyLearningPath(learningPathId: string, status: "accepted" | "rejected", adminReview: string): Promise<LearningPathDTO | null>;
}