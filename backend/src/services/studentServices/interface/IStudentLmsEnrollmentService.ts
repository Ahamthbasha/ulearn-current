import { ILearningPathEnrollment } from "../../../models/learningPathEnrollmentModel";
import {
  LearningPathDetailsDTO,
  LearningPathDTO,
} from "../../../dto/userDTO/lmsEnrollDTO";

export interface IStudentLmsEnrollmentService {
  getEnrolledLearningPaths(userId: string): Promise<LearningPathDTO[]>;
  getLearningPathDetails(
    userId: string,
    learningPathId: string,
  ): Promise<LearningPathDetailsDTO>;
  completeCourseAndUnlockNext(
    userId: string,
    learningPathId: string,
    courseId: string,
  ): Promise<ILearningPathEnrollment>;
  generateLearningPathCertificate(
    userId: string,
    learningPathId: string,
    studentName: string,
    learningPathTitle: string,
    instructorName: string,
  ): Promise<string>;
}
