import { Types } from "mongoose";
import { IStudentEnrollmentService } from "./interface/IStudentEnrollmentService";
import { IStudentEnrollmentRepository } from "../../repositories/studentRepository/interface/IStudentEnrollmentRepository";
import { IEnrollment } from "../../models/enrollmentModel";
import { EnrolledCourseDTO } from "../../dto/userDTO/enrollmentCourseDTO";
import { mapEnrollmentToDTO } from "../../mappers/userMapper/mapEnrollmentToDTO";
import { ICourseRepository } from "../../repositories/interfaces/ICourseRepository";
import { ICourse, ICourseFullyPopulated } from "../../models/courseModel";

export class StudentEnrollmentService implements IStudentEnrollmentService {
  private readonly _enrollmentRepo: IStudentEnrollmentRepository;
  private readonly _courseRepo: ICourseRepository;

  constructor(
    enrollmentRepo: IStudentEnrollmentRepository,
    courseRepo: ICourseRepository,
  ) {
    this._enrollmentRepo = enrollmentRepo;
    this._courseRepo = courseRepo;
  }

  async getAllEnrolledCourses(
    userId: Types.ObjectId,
  ): Promise<EnrolledCourseDTO[]> {
    const enrollmentData = await this._enrollmentRepo.getAllEnrolledCourses(userId);
    const courseIds = enrollmentData.map(({ enrollment }) => enrollment.courseId);
    const courses = await this._courseRepo.find(
      { _id: { $in: courseIds } },
      [],
      { courseName: 1 },
    );
    const courseMap = new Map<string, ICourse>(
      courses.map((course) => [course._id.toString(), course]),
    );

    const dtos = await Promise.all(
      enrollmentData.map(async ({ enrollment, order }) => {
        const course = courseMap.get(enrollment.courseId.toString());
        return await mapEnrollmentToDTO(enrollment, order, course);
      }),
    );

    return dtos.filter((dto): dto is EnrolledCourseDTO => dto !== null);
  }


  async getEnrollmentCourseWithDetails(
  userId: Types.ObjectId,
  courseId: Types.ObjectId,
): Promise<IEnrollment & { courseId: ICourseFullyPopulated } | null> {
  return this._enrollmentRepo.getEnrollmentByCourseDetails(userId, courseId);
}


  async completeChapter(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
    chapterId: Types.ObjectId,
  ): Promise<IEnrollment | null> {
    return this._enrollmentRepo.markChapterCompleted(userId, courseId, chapterId);
  }

  async submitQuizResult(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
    quizData: {
      quizId: Types.ObjectId;
      correctAnswers: number;
      totalQuestions: number;
      scorePercentage: number;
    },
  ): Promise<IEnrollment | null> {
    return this._enrollmentRepo.submitQuizResult(userId, courseId, quizData);
  }

  async areAllChaptersCompleted(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<boolean> {
    return this._enrollmentRepo.areAllChaptersCompleted(userId, courseId);
  }
}