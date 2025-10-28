import { ILearningPath, CreateLearningPathDTO } from "../../../models/learningPathModel";
import { LearningPathDTO, LearningPathListDTO } from "../../../dto/userDTO/learningPathDTO";
import { IMulterFile } from "../../../utils/s3Bucket";

export interface IStudentLearningPathService {
  createLearningPath(
    data: CreateLearningPathDTO,
    thumbnail?: IMulterFile,
  ): Promise<LearningPathDTO>;
  updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
    thumbnail?: IMulterFile,
  ): Promise<LearningPathDTO | null>;
  deleteLearningPath(learningPathId: string): Promise<ILearningPath | null>;
  getLearningPathById(learningPathId: string): Promise<LearningPathDTO | null>;
  getStudentLearningPathsPaginated(
    studentId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: LearningPathListDTO[]; total: number }>;
  isLearningPathAlreadyCreatedByStudent(
    title: string,
    studentId: string,
  ): Promise<boolean>;
  isLearningPathAlreadyCreatedByStudentExcluding(
    title: string,
    studentId: string,
    learningPathId: string,
  ): Promise<boolean>;
}