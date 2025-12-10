import { Types } from "mongoose";
import { ILearningPath } from "../../../models/learningPathModel";
import { ILearningPathEnrollment } from "../../../models/learningPathEnrollmentModel";
import { EnrichedCourse } from "../../../interface/studentInterface/ILmsDetailInterface";


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
    learningPath: ILearningPath & { thumbnailUrl: string; totalPrice: number };
    enrollment: ILearningPathEnrollment;
    courses: EnrichedCourse[];
  }>

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
