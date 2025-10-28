import { Types } from "mongoose";
import { ILearningPath } from "../../../models/learningPathModel";
import { IGenericRepository } from "../../../repositories/genericRepository";
import { ICourseOffer } from "../../../models/courseOfferModel";

export interface IStudentLmsRepo extends IGenericRepository<ILearningPath> {
  getLearningPaths(
    query?: string,
    page?: number,
    limit?: number,
    category?: string,
    sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc",
  ): Promise<{
    paths: ILearningPath[];
    total: number;
    offers: Map<string, ICourseOffer>;
  }>;
  getLearningPathById(
    pathId: Types.ObjectId,
  ): Promise<{ path: ILearningPath | null; offers: Map<string, ICourseOffer> }>;
  getLearningPathsByIds(
    ids: Types.ObjectId[],
  ): Promise<{ paths: ILearningPath[]; offers: Map<string, ICourseOffer> }>;
}
