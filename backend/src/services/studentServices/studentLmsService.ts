import { Types } from "mongoose";
import { IStudentLmsService } from "./interface/IStudentLmsService"; 
import { IStudentLmsRepo } from "../../repositories/studentRepository/interface/IStudentLmsRepo"; 
import { ILearningPath } from "../../models/learningPathModel"; 

export class StudentLmsService implements IStudentLmsService {
  constructor(private lmsRepo: IStudentLmsRepo) {}

  async getLearningPaths(
    query = "",
    page = 1,
    limit = 10,
    category?: string
  ): Promise<{ paths: ILearningPath[]; total: number }> {
    if (page < 1 || limit < 1) {
      throw new Error("Invalid pagination parameters");
    }
    return this.lmsRepo.getLearningPaths(query, page, limit, category);
  }

  async getLearningPathById(pathId: string): Promise<ILearningPath | null> {
    if (!Types.ObjectId.isValid(pathId)) {
      throw new Error("Invalid learning path ID");
    }
    return this.lmsRepo.getLearningPathById(new Types.ObjectId(pathId));
  }
}