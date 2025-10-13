import { IAdminLearningPathService } from "./interface/IAdminLearningPathService";
import { IAdminLearningPathRepository } from "../../repositories/adminRepository/interface/IAdminLearningPathRepo";
import { IAdminCourseOfferRepo } from "../../repositories/adminRepository/interface/IAdminCourseOfferRepo";
import { LearningPathDTO } from "../../dto/adminDTO/learningPathDTO";
import { LearningPathSummaryDTO } from "../../dto/adminDTO/learningPathSummaryDTO";
import { mapLearningPathToDTO } from "../../mappers/adminMapper/adminLearningPathMapper";
import { mapLearningPathsToSummaryDTO } from "../../mappers/adminMapper/mapLearningPathSummary";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export class AdminLearningPathService implements IAdminLearningPathService {
  private _learningPathRepository: IAdminLearningPathRepository;
  private _courseOfferRepository: IAdminCourseOfferRepo;

  constructor(
    learningPathRepository: IAdminLearningPathRepository,
    courseOfferRepository: IAdminCourseOfferRepo
  ) {
    this._learningPathRepository = learningPathRepository;
    this._courseOfferRepository = courseOfferRepository;
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

    // Fetch offers for each course
    const itemsWithOffers = await Promise.all(
      learningPath.items.map(async (item) => {
        const course = item.courseId as any;
        const offer = await this._courseOfferRepository.findValidOfferByCourseId(course._id.toString());
        return { item, offer };
      })
    );

    const dto = mapLearningPathToDTO(learningPath, itemsWithOffers);
    dto.items = await Promise.all(
      dto.items.map(async (item) => ({
        ...item,
        thumbnailUrl: item.thumbnailUrl ? await getPresignedUrl(item.thumbnailUrl) : undefined,
      }))
    );
    if (dto.thumbnailUrl) {
      dto.thumbnailUrl = await getPresignedUrl(dto.thumbnailUrl);
    }
    return dto;
  }

  async verifyLearningPath(learningPathId: string, status: "accepted" | "rejected", adminReview: string): Promise<LearningPathDTO | null> {
    const updated = await this._learningPathRepository.verifyLearningPath(learningPathId, status, adminReview);
    if (!updated) return null;

    // Fetch offers for each course
    const itemsWithOffers = await Promise.all(
      updated.items.map(async (item) => {
        const course = item.courseId as any;
        const offer = await this._courseOfferRepository.findValidOfferByCourseId(course._id.toString());
        return { item, offer };
      })
    );

    const dto = mapLearningPathToDTO(updated, itemsWithOffers);
    dto.items = await Promise.all(
      dto.items.map(async (item) => ({
        ...item,
        thumbnailUrl: item.thumbnailUrl ? await getPresignedUrl(item.thumbnailUrl) : undefined,
      }))
    );
    if (dto.thumbnailUrl) {
      dto.thumbnailUrl = await getPresignedUrl(dto.thumbnailUrl);
    }
    return dto;
  }
}