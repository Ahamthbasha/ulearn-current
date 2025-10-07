import { IAdminLearningPathService } from "./interface/IAdminLearningPathService";
import { IAdminLearningPathRepository } from "../../repositories/adminRepository/interface/IAdminLearningPathRepo";
import { LearningPathDTO } from "../../dto/adminDTO/learningPathDTO";
import { LearningPathSummaryDTO } from "../../dto/adminDTO/learningPathSummaryDTO";
import { mapLearningPathToDTO } from "../../mappers/adminMapper/adminLearningPathMapper";
import { mapLearningPathsToSummaryDTO } from "../../mappers/adminMapper/mapLearningPathSummary"; 
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export class AdminLearningPathService implements IAdminLearningPathService {
  private _learningPathRepository: IAdminLearningPathRepository;

  constructor(learningPathRepository: IAdminLearningPathRepository) {
    this._learningPathRepository = learningPathRepository;
  }

  async getSubmittedLearningPaths(
    page: number,
    limit: number,
    search?: string,
    status?: string
  ): Promise<{ data: LearningPathSummaryDTO[]; total: number }> {
    const result = await this._learningPathRepository.getSubmittedLearningPaths(page, limit, search, status);
    const dtos = mapLearningPathsToSummaryDTO(result.data);
    return { data: dtos, total: result.total };
  }

  async getLearningPathById(learningPathId: string): Promise<LearningPathDTO | null> {
    const learningPath = await this._learningPathRepository.getLearningPathById(learningPathId);
    if (!learningPath) return null;
    const dto = mapLearningPathToDTO(learningPath);
    dto.items = await Promise.all(
      dto.items.map(async (item) => ({
        ...item,
        thumbnailUrl: item.thumbnailUrl ? await getPresignedUrl(item.thumbnailUrl) : undefined,
      }))
    );
    return dto;
  }

  async verifyLearningPath(learningPathId: string, status: "accepted" | "rejected", adminReview: string): Promise<LearningPathDTO | null> {
    const updated = await this._learningPathRepository.verifyLearningPath(learningPathId, status, adminReview);
    if (!updated) return null;
    const dto = mapLearningPathToDTO(updated);
    dto.items = await Promise.all(
      dto.items.map(async (item) => ({
        ...item,
        thumbnailUrl: item.thumbnailUrl ? await getPresignedUrl(item.thumbnailUrl) : undefined,
      }))
    );
    return dto;
  }  
}