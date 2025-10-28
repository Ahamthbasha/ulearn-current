import { Types } from "mongoose";
import { ILearningPath } from "../../../models/learningPathModel";
import { ILearningPathEnrollment } from "../../../models/learningPathEnrollmentModel";
import { ICourse } from "../../../models/courseModel";

export interface IStudentLmsEnrollmentRepo {
  getEnrolledLearningPaths(userId: Types.ObjectId): Promise<
    Array<{
      learningPath: ILearningPath;
      enrollment: ILearningPathEnrollment;
    }>
  >;

  getLearningPathDetails(
    userId: Types.ObjectId,
    learningPathId: Types.ObjectId,
  ): Promise<{
    learningPath: ILearningPath;
    enrollment: ILearningPathEnrollment;
    courses: ICourse[];
  }>;

  updateUnlockedOrder(
    enrollmentId: Types.ObjectId,
    unlockedOrder: number,
  ): Promise<ILearningPathEnrollment>;

  markCourseCompleted(
    enrollmentId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<ILearningPathEnrollment>;

  generateLearningPathCertificate(
    enrollmentId: Types.ObjectId,
    studentName: string,
    learningPathTitle: string,
    instructorName: string,
  ): Promise<string>;
}
