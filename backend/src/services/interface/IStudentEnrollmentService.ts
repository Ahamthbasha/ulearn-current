import { Types } from "mongoose";
import { IEnrollment } from "../../models/enrollmentModel";

export interface IStudentEnrollmentService {
  getAllEnrolledCourses(userId: Types.ObjectId): Promise<IEnrollment[]>;
  getEnrollmentCourseWithDetails(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<IEnrollment | null>;
  completeChapter(userId: Types.ObjectId, courseId: Types.ObjectId, chapterId: Types.ObjectId): Promise<IEnrollment | null>;


   submitQuizResult(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
    quizData: {
      quizId: Types.ObjectId;
      correctAnswers: number;
      totalQuestions: number;
      scorePercentage: number;
    }
  ): Promise<IEnrollment | null>;

  areAllChaptersCompleted(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<boolean>;

}
