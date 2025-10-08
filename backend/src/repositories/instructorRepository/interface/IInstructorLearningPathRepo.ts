import { ILearningPath, CreateLearningPathDTO } from "../../../models/learningPathModel";

export interface IInstructorLearningPathRepository {
  createLearningPath(data: CreateLearningPathDTO): Promise<ILearningPath>;
  updateLearningPath(learningPathId: string, data: Partial<ILearningPath>): Promise<ILearningPath | null>;
  deleteLearningPath(learningPathId: string): Promise<ILearningPath | null>;
  getLearningPathById(learningPathId: string): Promise<ILearningPath | null>;
  getLearningPathsByInstructorWithPagination(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: ILearningPath[]; total: number }>;
  findLearningPathByTitleForInstructor(title: string, instructorId: string): Promise<ILearningPath | null>;
  findLearningPathByTitleForInstructorExcludingId(
    title: string,
    instructorId: string,
    excludeId: string,
  ): Promise<ILearningPath | null>;
  publishLearningPath(learningPathId: string): Promise<ILearningPath | null>;
  validateCoursesForInstructor(courseIds: string[], instructorId: string): Promise<boolean>;
}