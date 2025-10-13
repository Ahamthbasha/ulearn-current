import { Types } from "mongoose";
import { CreateLearningPathDTO, ILearningPath } from "../../models/learningPathModel";
import { LearningPathDTO, LearningPathListDTO } from "../../dto/instructorDTO/learningPathDTO";
import { IInstructorLearningPathRepository } from "../../repositories/instructorRepository/interface/IInstructorLearningPathRepo";
import { IInstructorLearningPathService } from "./interface/IInstructorLearningPathService";
import { ICourse } from "../../models/courseModel";
import { uploadToS3Bucket, IMulterFile } from "../../utils/s3Bucket";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { mapLearningPathToDTO, mapLearningPathsToListDTO } from "../../mappers/instructorMapper/learningPathMapper";

export class InstructorLearningPathService implements IInstructorLearningPathService {
  private _learningPathRepository: IInstructorLearningPathRepository;

  constructor(learningPathRepository: IInstructorLearningPathRepository) {
    this._learningPathRepository = learningPathRepository;
  }

  async createLearningPath(data: CreateLearningPathDTO, thumbnail?: IMulterFile): Promise<LearningPathDTO> {
    try {
      if (thumbnail) {
        const thumbnailKey = await uploadToS3Bucket(thumbnail, `learning-paths/${data.instructorId}`);
        data.thumbnailUrl = thumbnailKey;
      }

      const valid = await this._learningPathRepository.validateCoursesForInstructor(
        data.items.map((item) =>
          item.courseId instanceof Types.ObjectId ? item.courseId.toString() : (item.courseId as ICourse)._id.toString()
        ),
        data.instructorId.toString()
      );
      if (!valid) {
        throw new Error("Invalid courses: Must be published and owned by instructor");
      }

      const learningPath = await this._learningPathRepository.createLearningPath(data);
      await learningPath.totalPrice; // Ensure totalPrice is computed
      return await mapLearningPathToDTO(learningPath);
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
      const existingLearningPath = await this._learningPathRepository.getLearningPathById(learningPathId);
      if (!existingLearningPath) {
        throw new Error("Learning path not found");
      }

      if (thumbnail) {
        const instructorId = data.instructorId?.toString() || existingLearningPath.instructorId.toString();
        const thumbnailKey = await uploadToS3Bucket(thumbnail, `learning-paths/${instructorId}`);
        data.thumbnailUrl = thumbnailKey;
      }

      if (data.items) {
        const valid = await this._learningPathRepository.validateCoursesForInstructor(
          data.items.map((item) =>
            item.courseId instanceof Types.ObjectId ? item.courseId.toString() : (item.courseId as ICourse)._id.toString()
          ),
          data.instructorId?.toString() || existingLearningPath.instructorId.toString()
        );
        if (!valid) {
          throw new Error("Invalid courses: Must be published and owned by instructor");
        }
      }

      const updated = await this._learningPathRepository.updateLearningPath(learningPathId, data);
      if (!updated) {
        return null;
      }
      await updated.totalPrice; // Ensure totalPrice is computed
      return await mapLearningPathToDTO(updated);
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

    await learningPath.totalPrice; // Ensure totalPrice is computed
    const dto = await mapLearningPathToDTO(learningPath); // Await the async mapping
    dto.items = await Promise.all(
      dto.items.map(async (item: { courseId: string; order: number; courseName?: string; thumbnailUrl?: string; price?: number }) => ({
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

    const valid = await this._learningPathRepository.validateCoursesForInstructor(
      learningPath.items.map((item) =>
        item.courseId instanceof Types.ObjectId ? item.courseId.toString() : (item.courseId as ICourse)._id.toString()
      ),
      learningPath.instructorId.toString()
    );
    if (!valid) {
      throw new Error("All courses must be published and owned by the instructor");
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

    const valid = await this._learningPathRepository.validateCoursesForInstructor(
      learningPath.items.map((item) =>
        item.courseId instanceof Types.ObjectId ? item.courseId.toString() : (item.courseId as ICourse)._id.toString()
      ),
      learningPath.instructorId.toString()
    );
    if (!valid) {
      throw new Error("All courses must be published and owned by the instructor");
    }

    return await this._learningPathRepository.updateLearningPath(learningPathId, {
      status: "pending",
      adminReview: undefined,
    });
  }
}