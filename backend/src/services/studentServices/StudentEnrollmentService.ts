import { Types } from "mongoose";
import { IStudentEnrollmentService } from "../interface/IStudentEnrollmentService";
import { IStudentEnrollmentRepository } from "../../repositories/interfaces/IStudentEnrollmentRepository";
import { IEnrollment } from "../../models/enrollmentModel";

export class StudentEnrollmentService implements IStudentEnrollmentService {
  private enrollmentRepo: IStudentEnrollmentRepository;

  constructor(enrollmentRepo: IStudentEnrollmentRepository) {
    this.enrollmentRepo = enrollmentRepo;
  }

  async getAllEnrolledCourses(userId: Types.ObjectId): Promise<IEnrollment[]> {
    return this.enrollmentRepo.getAllEnrolledCourses(userId);
  }

  async getEnrollmentCourseWithDetails(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<IEnrollment | null> {
    return this.enrollmentRepo.getEnrollmentByCourseDetails(userId, courseId);
  }

  async completeChapter(userId: Types.ObjectId, courseId: Types.ObjectId, chapterId: Types.ObjectId): Promise<IEnrollment | null> {
    return this.enrollmentRepo.markChapterCompleted(userId, courseId, chapterId);
  }

  async submitQuizResult(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
    quizData: {
      quizId: Types.ObjectId;
      correctAnswers: number;
      totalQuestions: number;
      scorePercentage: number;
    }
  ): Promise<IEnrollment | null> {
    return this.enrollmentRepo.submitQuizResult(userId, courseId, quizData);
  }

  async areAllChaptersCompleted(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<boolean> {
  return this.enrollmentRepo.areAllChaptersCompleted(userId, courseId);
}


}
