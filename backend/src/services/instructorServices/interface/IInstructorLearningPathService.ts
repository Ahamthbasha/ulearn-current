import { ILearningPath, CreateLearningPathDTO } from "../../../models/learningPathModel";
import { LearningPathDTO,LearningPathListDTO } from "../../../dto/instructorDTO/learningPathDTO";
import { IMulterFile } from "../../../utils/s3Bucket";

export interface IInstructorLearningPathService {
  createLearningPath(data: CreateLearningPathDTO, thumbnail?: IMulterFile): Promise<LearningPathDTO>;
  updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
    thumbnail?: IMulterFile
  ): Promise<LearningPathDTO | null>;
  deleteLearningPath(learningPathId: string): Promise<ILearningPath | null>;
  getLearningPathById(learningPathId: string): Promise<LearningPathDTO | null>;
  getInstructorLearningPathsPaginated(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: LearningPathListDTO[]; total: number }>;
  isLearningPathAlreadyCreatedByInstructor(
    title: string,
    instructorId: string,
  ): Promise<boolean>;
  isLearningPathAlreadyCreatedByInstructorExcluding(
    title: string,
    instructorId: string,
    learningPathId: string,
  ): Promise<boolean>;
  publishLearningPath(learningPathId: string): Promise<ILearningPath | null>;
  submitLearningPathToAdmin(learningPathId: string): Promise<ILearningPath | null>;
  resubmitLearningPathToAdmin(learningPathId: string): Promise<ILearningPath | null>;
}