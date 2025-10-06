import { ILearningPath, CreateLearningPathDTO } from "../../../models/learningPathModel";
import { LearningPathDTO } from "../../../dto/instructorDTO/learningPathDTO"; 

export interface IInstructorLearningPathService {
  createLearningPath(data: CreateLearningPathDTO): Promise<LearningPathDTO>;
  updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
  ): Promise<LearningPathDTO | null>;
  deleteLearningPath(learningPathId: string): Promise<ILearningPath | null>;
  getLearningPathById(learningPathId: string): Promise<LearningPathDTO | null>;
  getInstructorLearningPathsPaginated(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: LearningPathDTO[]; total: number }>;
  isLearningPathAlreadyCreatedByInstructor(
    title: string,
    instructorId: string,
  ): Promise<boolean>;
  isLearningPathAlreadyCreatedByInstructorExcluding(
    title: string,
    instructorId: string,
    learningPathId: string,
  ): Promise<boolean>;
  publishLearningPath(learningPathId: string, publishDate?: Date): Promise<ILearningPath | null>;
  canPublishLearningPath(learningPathId: string): Promise<boolean>;
}