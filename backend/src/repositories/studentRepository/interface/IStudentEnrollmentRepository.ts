import { Types } from "mongoose";
import { IEnrollment } from "../../../models/enrollmentModel";
import { IOrder } from "../../../models/orderModel";

export interface IStudentEnrollmentRepository {
  getAllEnrolledCourses(
    userId: Types.ObjectId,
  ): Promise<{ enrollment: IEnrollment; order?: IOrder }[]>;
  getEnrollmentByCourseDetails(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<IEnrollment | null>;
  markChapterCompleted(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
    chapterId: Types.ObjectId,
  ): Promise<IEnrollment | null>;
  submitQuizResult(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
    quizData: {
      quizId: Types.ObjectId;
      correctAnswers: number;
      totalQuestions: number;
      scorePercentage: number;
    },
  ): Promise<IEnrollment | null>;
  areAllChaptersCompleted(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<boolean>;
  findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<IEnrollment | null>;
  findByUserAndCourseWithPopulate(
    userId: string,
    courseId: string,
    populateOptions: {
      path: string;
      populate?: { path: string }[];
    }[],
  ): Promise<IEnrollment | null>;
  findOne(
    query: Partial<Record<keyof IEnrollment, unknown>>,
    populateOptions?: {
      path: string;
      populate?: { path: string }[];
    }[],
  ): Promise<IEnrollment | null>;
}