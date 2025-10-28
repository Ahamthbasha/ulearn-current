import { ILearningPath, CreateLearningPathDTO } from "../../../models/learningPathModel";

export interface IStudentLearningPathRepository {
  createLearningPath(data: CreateLearningPathDTO): Promise<ILearningPath>;
  updateLearningPath(
    learningPathId: string,
    data: Partial<ILearningPath>,
  ): Promise<ILearningPath | null>;
  deleteLearningPath(learningPathId: string): Promise<ILearningPath | null>;
  getLearningPathById(learningPathId: string): Promise<ILearningPath | null>;
  getLearningPathsByStudentWithPagination(
    studentId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ILearningPath[]; total: number }>;
  findLearningPathByTitleForStudent(
    title: string,
    studentId: string,
  ): Promise<ILearningPath | null>;
  findLearningPathByTitleForStudentExcludingId(
    title: string,
    studentId: string,
    excludeId: string,
  ): Promise<ILearningPath | null>;
}