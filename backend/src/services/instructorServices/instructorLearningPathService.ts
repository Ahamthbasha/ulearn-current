import { ILearningPath, CreateLearningPathDTO } from "../../models/learningPathModel";
import { LearningPathDTO } from "../../dto/instructorDTO/learningPathDTO";
import { IInstructorLearningPathRepository } from "../../repositories/instructorRepository/interface/IInstructorLearningPathRepo";
import { IInstructorLearningPathService } from "./interface/IInstructorLearningPathService";
import { mapLearningPathToDTO, mapLearningPathsToDTO } from "../../mappers/instructorMapper/learningPathMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export class InstructorLearningPathService implements IInstructorLearningPathService {
  private _learningPathRepository: IInstructorLearningPathRepository;

  constructor(learningPathRepository: IInstructorLearningPathRepository) {
    this._learningPathRepository = learningPathRepository;
  }

  async createLearningPath(data: CreateLearningPathDTO): Promise<LearningPathDTO> {
    const courseIds = data.items.map((item) => item.courseId);
    const valid = await this._learningPathRepository.validateCoursesForInstructor(courseIds, data.instructorId.toString());
    if (!valid) {
      throw new Error("Invalid courses: Must be published and owned by instructor");
    }
    const learningPath = await this._learningPathRepository.createLearningPath(data);
    return mapLearningPathToDTO(learningPath);
  }

  async updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
  ): Promise<LearningPathDTO | null> {
    if (data.items) {
      const courseIds = data.items.map((item) => item.courseId);
      const original = await this._learningPathRepository.getLearningPathById(learningPathId);
      if (!original) throw new Error("Learning path not found");
      const valid = await this._learningPathRepository.validateCoursesForInstructor(courseIds, original.instructorId.toString());
      if (!valid) {
        throw new Error("Invalid courses: Must be published and owned by instructor");
      }
    }
    const updated = await this._learningPathRepository.updateLearningPath(learningPathId, data);
    if (!updated) return null;
    return mapLearningPathToDTO(updated);
  }

  async deleteLearningPath(learningPathId: string): Promise<ILearningPath | null> {
    return await this._learningPathRepository.deleteLearningPath(learningPathId);
  }

  async getLearningPathById(learningPathId: string): Promise<LearningPathDTO | null> {
    const learningPath = await this._learningPathRepository.getLearningPathById(learningPathId);
    if (!learningPath) return null;
    const dto = mapLearningPathToDTO(learningPath);
    dto.items = await Promise.all(
      dto.items.map(async (item) => ({
        ...item,
        thumbnailUrl: item.thumbnailUrl ? await getPresignedUrl(item.thumbnailUrl) : undefined,
      })),
    );
    return dto;
  }

  async getInstructorLearningPathsPaginated(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: LearningPathDTO[]; total: number }> {
    const result = await this._learningPathRepository.getLearningPathsByInstructorWithPagination(
      instructorId,
      page,
      limit,
      search,
      status,
    );
    const dtos = await Promise.all(
      mapLearningPathsToDTO(result.data).map(async (dto) => {
        dto.items = await Promise.all(
          dto.items.map(async (item) => ({
            ...item,
            thumbnailUrl: item.thumbnailUrl ? await getPresignedUrl(item.thumbnailUrl) : undefined,
          })),
        );
        return dto;
      }),
    );
    return { data: dtos, total: result.total };
  }

  async isLearningPathAlreadyCreatedByInstructor(
    title: string,
    instructorId: string,
  ): Promise<boolean> {
    const existing = await this._learningPathRepository.findLearningPathByTitleForInstructor(title, instructorId);
    return !!existing;
  }

  async isLearningPathAlreadyCreatedByInstructorExcluding(
    title: string,
    instructorId: string,
    learningPathId: string,
  ): Promise<boolean> {
    const existing = await this._learningPathRepository.findLearningPathByTitleForInstructorExcludingId(
      title,
      instructorId,
      learningPathId,
    );
    return !!existing;
  }

  async canPublishLearningPath(learningPathId: string): Promise<boolean> {
    const learningPath = await this._learningPathRepository.getLearningPathById(learningPathId);
    return !!learningPath && learningPath.items.length > 0;
  }

  async publishLearningPath(learningPathId: string, publishDate?: Date): Promise<ILearningPath | null> {
    return await this._learningPathRepository.publishLearningPath(learningPathId, publishDate);
  }
}