import {
  LearningPathListDTOUSER,
  LearningPathDetailDTO,
} from "../../../dto/userDTO/userLearningPathDTO";

export interface IStudentLmsService {
  getLearningPaths(
    query?: string,
    page?: number,
    limit?: number,
    category?: string,
    sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc",
  ): Promise<{ paths: LearningPathListDTOUSER[]; total: number }>;

  getLearningPathById(pathId: string): Promise<LearningPathDetailDTO | null>;
}
