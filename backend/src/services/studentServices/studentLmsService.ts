import { Types } from "mongoose";
import { IStudentLmsService } from "./interface/IStudentLmsService";
import { IStudentLmsRepo } from "../../repositories/studentRepository/interface/IStudentLmsRepo";
import {
  LearningPathListDTOUSER,
  LearningPathDetailDTO,
} from "../../dto/userDTO/userLearningPathDTO";
import { mapToLearningPathListDTOUSER } from "../../mappers/userMapper/userLearningPathListMapper";
import { mapToLearningPathDetailDTO } from "../../mappers/userMapper/userLearnPathDetailMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { appLogger } from "../../utils/logger";

export class StudentLmsService implements IStudentLmsService {
  private _lmsRepo: IStudentLmsRepo;

  constructor(lmsRepo: IStudentLmsRepo) {
    this._lmsRepo = lmsRepo;
  }

  async getLearningPaths(
    query = "",
    page = 1,
    limit = 10,
    category?: string,
    sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc",
  ): Promise<{ paths: LearningPathListDTOUSER[]; total: number }> {
    if (page < 1 || limit < 1) {
      throw new Error("Invalid pagination parameters");
    }

    const { paths, total, offers } = await this._lmsRepo.getLearningPaths(
      query,
      page,
      limit,
      category,
      sort,
    );

    const mappedPaths = await Promise.all(
      paths.map(async (path) => {
        try {
          return await mapToLearningPathListDTOUSER(
            path,
            getPresignedUrl,
            offers,
          );
        } catch (error) {
          appLogger.error(`Error mapping learning path ${path._id}:`, error);
          return null;
        }
      }),
    );

    // Filter out null mappings and assert non-null type
    const validPaths: LearningPathListDTOUSER[] = mappedPaths.filter(
      (path): path is LearningPathListDTOUSER => path !== null,
    );

    // Handle price-based sorting in the service layer
    if (sort === "price-asc" || sort === "price-desc") {
      validPaths.sort((a, b) => {
        const priceA = a.totalPrice ?? 0;
        const priceB = b.totalPrice ?? 0;
        return sort === "price-asc" ? priceA - priceB : priceB - priceA;
      });
    }

    return {
      paths: validPaths,
      total,
    };
  }

  async getLearningPathById(
    pathId: string,
  ): Promise<LearningPathDetailDTO | null> {
    if (!Types.ObjectId.isValid(pathId)) {
      throw new Error("Invalid learning path ID");
    }

    const { path, offers } = await this._lmsRepo.getLearningPathById(
      new Types.ObjectId(pathId),
    );
    if (!path) {
      return null;
    }

    return mapToLearningPathDetailDTO(path, getPresignedUrl, offers);
  }
}
