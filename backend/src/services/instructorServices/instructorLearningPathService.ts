import { Types } from "mongoose";
import { CreateLearningPathDTO, ILearningPath } from "../../models/learningPathModel";
import { LearningPathDTO, LearningPathListDTO } from "../../dto/instructorDTO/learningPathDTO";
import { IInstructorLearningPathRepository } from "../../repositories/instructorRepository/interface/IInstructorLearningPathRepo";
import { IInstructorLearningPathService } from "./interface/IInstructorLearningPathService";
import { ICourse } from "../../models/courseModel";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { IMulterFile } from "../../utils/s3Bucket";
import { mapLearningPathToDTO, mapLearningPathsToListDTO } from "../../mappers/instructorMapper/learningPathMapper";
import { CategoryModel } from "../../models/categoryModel";

export class InstructorLearningPathService implements IInstructorLearningPathService {
  private _learningPathRepository: IInstructorLearningPathRepository;

  constructor(learningPathRepository: IInstructorLearningPathRepository) {
    this._learningPathRepository = learningPathRepository;
  }

  async createLearningPath(data: CreateLearningPathDTO, thumbnail?: IMulterFile): Promise<LearningPathDTO> {
    try {
      const courseIds = data.items.map((item) =>
        item.courseId instanceof Types.ObjectId ? item.courseId.toString() : (item.courseId as ICourse)._id.toString()
      );
      const uniqueCourseIds = new Set(courseIds);
      if (uniqueCourseIds.size !== courseIds.length) {
        throw new Error("Duplicate courses are not allowed in a learning path");
      }

      const orders = data.items.map((item) => item.order);
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== orders.length) {
        throw new Error("Duplicate order numbers are not allowed in a learning path");
      }

      // Validate category exists
      const categoryExists = await CategoryModel.findById(data.category).lean();
      if (!categoryExists) {
        throw new Error("Invalid category ID");
      }

      if (thumbnail) {
        const thumbnailKey = await uploadToS3Bucket(thumbnail, `learning-paths/${data.instructorId}`);
        data.thumbnailUrl = thumbnailKey;
      }

      const valid = await this._learningPathRepository.validateCoursesForInstructor(courseIds, data.instructorId.toString());
      if (!valid) {
        throw new Error("Invalid courses: Must be published and owned by instructor");
      }

      const learningPath = await this._learningPathRepository.createLearningPath(data);
      return mapLearningPathToDTO(learningPath);
    } catch (error: any) {
      console.error("Error in createLearningPath:", error.message, error.stack);
      throw new Error(`Failed to create learning path: ${error.message}`);
    }
  }

  async updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
    thumbnail?: IMulterFile
  ): Promise<LearningPathDTO | null> {
    try {
      if (data.items) {
        const courseIds = data.items.map((item) =>
          item.courseId instanceof Types.ObjectId ? item.courseId.toString() : (item.courseId as ICourse)._id.toString()
        );
        const uniqueCourseIds = new Set(courseIds);
        if (uniqueCourseIds.size !== courseIds.length) {
          throw new Error("Duplicate courses are not allowed in a learning path");
        }

        const orders = data.items.map((item) => item.order);
        const uniqueOrders = new Set(orders);
        if (uniqueOrders.size !== orders.length) {
          throw new Error("Duplicate order numbers are not allowed in a learning path");
        }
      }

      if (data.category) {
        const categoryExists = await CategoryModel.findById(data.category).lean();
        if (!categoryExists) {
          throw new Error("Invalid category ID");
        }
      }

      if (thumbnail) {
        const instructorId = data.instructorId?.toString() || (await this._learningPathRepository.getLearningPathById(learningPathId))?.instructorId.toString();
        const thumbnailKey = await uploadToS3Bucket(thumbnail, `learning-paths/${instructorId}`);
        data.thumbnailUrl = thumbnailKey;
      }

      const updated = await this._learningPathRepository.updateLearningPath(learningPathId, data);
      if (!updated) {
        return null;
      }
      return mapLearningPathToDTO(updated);
    } catch (error: any) {
      console.error("Error in updateLearningPath:", error.message, error.stack);
      throw new Error(`Failed to update learning path: ${error.message}`);
    }
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
      }))
    );
    if (dto.thumbnailUrl) {
      dto.thumbnailUrl = await getPresignedUrl(dto.thumbnailUrl);
    }
    return dto;
  }

  async getInstructorLearningPathsPaginated(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: LearningPathListDTO[]; total: number }> {
    const result = await this._learningPathRepository.getLearningPathsByInstructorWithPagination(
      instructorId,
      page,
      limit,
      search,
      status,
    );
    const dtos = await Promise.all(
      mapLearningPathsToListDTO(result.data).map(async (dto: LearningPathListDTO) => {
        if (dto.thumbnailUrl) {
          dto.thumbnailUrl = await getPresignedUrl(dto.thumbnailUrl);
        }
        return dto;
      })
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

  async publishLearningPath(learningPathId: string): Promise<ILearningPath | null> {
    return await this._learningPathRepository.publishLearningPath(learningPathId);
  }

  async submitLearningPathToAdmin(learningPathId: string): Promise<ILearningPath | null> {
    const learningPath = await this._learningPathRepository.getLearningPathById(learningPathId);
    if (!learningPath) {
      throw new Error("Learning path not found");
    }
    if (learningPath.status === "pending") {
      throw new Error("Learning path already submitted");
    }
    if (learningPath.status === "accepted") {
      throw new Error("Learning path already accepted");
    }
    if (learningPath.items.length === 0) {
      throw new Error("Cannot submit an empty learning path");
    }
    return await this._learningPathRepository.updateLearningPath(learningPathId, {
      status: "pending",
      adminReview: undefined,
    });
  }

  async resubmitLearningPathToAdmin(learningPathId: string): Promise<ILearningPath | null> {
    const learningPath = await this._learningPathRepository.getLearningPathById(learningPathId);
    if (!learningPath) {
      throw new Error("Learning path not found");
    }
    if (learningPath.status !== "rejected") {
      throw new Error("Learning path can only be resubmitted if it was rejected");
    }
    if (learningPath.items.length === 0) {
      throw new Error("Cannot resubmit an empty learning path");
    }
    return await this._learningPathRepository.updateLearningPath(learningPathId, {
      status: "pending",
      adminReview: undefined,
    });
  }
}