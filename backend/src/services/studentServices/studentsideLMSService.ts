import {
  CreateLearningPathDTO,
  ILearningPath,
} from "../../models/learningPathModel";
import {
  LearningPathDTO,
  LearningPathListDTO,
} from "../../dto/userDTO/learningPathDTO";
import { IStudentLearningPathRepository } from "../../repositories/studentRepository/interface/IStudentsideLMSRepo";
import { IStudentLearningPathService } from "./interface/IStudentsideLMSService";
import { uploadToS3Bucket, IMulterFile } from "../../utils/s3Bucket";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import {
  mapLearningPathToDTO,
  mapLearningPathsToListDTO,
} from "../../mappers/userMapper/learningPathMapper";
import { appLogger } from "../../utils/logger";

export class StudentLearningPathService implements IStudentLearningPathService {
  private _learningPathRepository: IStudentLearningPathRepository;

  constructor(learningPathRepository: IStudentLearningPathRepository) {
    this._learningPathRepository = learningPathRepository;
  }

  async createLearningPath(
    data: CreateLearningPathDTO,
    thumbnail?: IMulterFile,
  ): Promise<LearningPathDTO> {
    try {
      if (thumbnail) {
        const thumbnailKey = await uploadToS3Bucket(
          thumbnail,
          `learning-paths/${data.studentId}`,
        );
        data.thumbnailUrl = thumbnailKey;
      }

      const learningPath =
        await this._learningPathRepository.createLearningPath(data);
      await learningPath.totalPrice; // Ensure totalPrice is computed
      return await mapLearningPathToDTO(learningPath);
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      appLogger.error(
        "Error in createLearningPath:",
        errorMessage
      );
      throw new Error(`Failed to create learning path: ${errorMessage}`);
    }
  }

  async updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
    thumbnail?: IMulterFile,
  ): Promise<LearningPathDTO | null> {
    try {
      const existingLearningPath =
        await this._learningPathRepository.getLearningPathById(learningPathId);
      if (!existingLearningPath) {
        throw new Error("Learning path not found");
      }

      if (thumbnail) {
        const studentId =
          data.studentId?.toString() ||
          existingLearningPath.studentId.toString();
        const thumbnailKey = await uploadToS3Bucket(
          thumbnail,
          `learning-paths/${studentId}`,
        );
        data.thumbnailUrl = thumbnailKey;
      }

      const updated = await this._learningPathRepository.updateLearningPath(
        learningPathId,
        data,
      );
      if (!updated) {
        return null;
      }
      await updated.totalPrice; // Ensure totalPrice is computed
      return await mapLearningPathToDTO(updated);
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      appLogger.error(
        "Error in updateLearningPath:",
        errorMessage,
      );
      throw new Error(`Failed to update learning path: ${errorMessage}`);
    }
  }

  async deleteLearningPath(
    learningPathId: string,
  ): Promise<ILearningPath | null> {
    return await this._learningPathRepository.deleteLearningPath(
      learningPathId,
    );
  }

  async getLearningPathById(
    learningPathId: string,
  ): Promise<LearningPathDTO | null> {
    const learningPath =
      await this._learningPathRepository.getLearningPathById(learningPathId);
    if (!learningPath) return null;

    await learningPath.totalPrice; // Ensure totalPrice is computed
    const dto = await mapLearningPathToDTO(learningPath);
    dto.items = await Promise.all(
      dto.items.map(
        async (item: {
          courseId: string;
          order: number;
          courseName?: string;
          thumbnailUrl?: string;
          price?: number;
        }) => ({
          ...item,
          thumbnailUrl: item.thumbnailUrl
            ? await getPresignedUrl(item.thumbnailUrl)
            : undefined,
        }),
      ),
    );
    if (dto.thumbnailUrl) {
      dto.thumbnailUrl = await getPresignedUrl(dto.thumbnailUrl);
    }
    return dto;
  }

  async getStudentLearningPathsPaginated(
    studentId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: LearningPathListDTO[]; total: number }> {
    const result =
      await this._learningPathRepository.getLearningPathsByStudentWithPagination(
        studentId,
        page,
        limit,
        search,
      );
    const dtos = await Promise.all(
      mapLearningPathsToListDTO(result.data).map(
        async (dto: LearningPathListDTO) => {
          if (dto.thumbnailUrl) {
            dto.thumbnailUrl = await getPresignedUrl(dto.thumbnailUrl);
          }
          return dto;
        },
      ),
    );
    return { data: dtos, total: result.total };
  }

  async isLearningPathAlreadyCreatedByStudent(
    title: string,
    studentId: string,
  ): Promise<boolean> {
    const existing =
      await this._learningPathRepository.findLearningPathByTitleForStudent(
        title,
        studentId,
      );
    return !!existing;
  }

  async isLearningPathAlreadyCreatedByStudentExcluding(
    title: string,
    studentId: string,
    learningPathId: string,
  ): Promise<boolean> {
    const existing =
      await this._learningPathRepository.findLearningPathByTitleForStudentExcludingId(
        title,
        studentId,
        learningPathId,
      );
    return !!existing;
  }
}