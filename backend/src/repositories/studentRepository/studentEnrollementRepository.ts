import { Types } from "mongoose";
import { GenericRepository } from "../genericRepository";
import { IStudentEnrollmentRepository } from "./interface/IStudentEnrollmentRepository";
import { EnrollmentModel, IEnrollment } from "../../models/enrollmentModel";
import { generateCertificate } from "../../utils/certificateGenerator";
import { IStudentRepository } from "./interface/IStudentRepository";
import IInstructorRepository from "../instructorRepository/interface/IInstructorRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { IOrder } from "../../models/orderModel";
import { appLogger } from "../../utils/logger";
import { ICourse } from "../../models/courseModel";

export class StudentEnrollmentRepository
  extends GenericRepository<IEnrollment>
  implements IStudentEnrollmentRepository
{
  private readonly _studentRepository: IStudentRepository;
  private readonly _instructorRepository: IInstructorRepository;
  private readonly _orderRepository: IOrderRepository;

  constructor(
    studentRepository: IStudentRepository,
    instructorRepository: IInstructorRepository,
    orderRepository: IOrderRepository,
  ) {
    super(EnrollmentModel);
    this._studentRepository = studentRepository;
    this._instructorRepository = instructorRepository;
    this._orderRepository = orderRepository;
  }

  async getAllEnrolledCourses(
    userId: Types.ObjectId,
  ): Promise<{ enrollment: IEnrollment; order?: IOrder }[]> {
    const enrollments = await this.findAll(
      { userId, learningPathId: { $exists: false } },
      [],
    );

    if (!enrollments || enrollments.length === 0) return [];

    const orders = await this._orderRepository.findByUser(userId);
    const orderMap = new Map<string, IOrder>();
    orders.forEach((order) => {
      order.courses.forEach((course) => {
        orderMap.set(course.courseId.toString(), order);
      });
    });

    return enrollments.map((enrollment) => ({
      enrollment,
      order: orderMap.get(enrollment.courseId.toString()),
    }));
  }

  async getEnrollmentByCourseDetails(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<IEnrollment | null> {
    return this.findOne(
      { userId, courseId },
      [
        {
          path: "courseId",
          populate: [{ path: "chapters" }, { path: "quizzes" }],
        },
      ],
    );
  }

  async markChapterCompleted(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
    chapterId: Types.ObjectId,
  ): Promise<IEnrollment | null> {
    try {
      const enrollment = await this.findOne(
        { userId, courseId },
        [
          {
            path: "courseId",
            populate: { path: "chapters" },
          },
        ],
      );

      if (!enrollment || !enrollment.courseId) return null;

      const isChapterCompleted = enrollment.completedChapters.some(
        (ch) => ch.chapterId.equals(chapterId) && ch.isCompleted,
      );

      if (isChapterCompleted) return enrollment;

      const course = enrollment.courseId as unknown as ICourse & { chapters: { length: number } };
      const totalChapters = Array.isArray(course.chapters) ? course.chapters.length : 0;
      const completedChaptersCount = enrollment.completedChapters.filter((ch) => ch.isCompleted).length + 1;
      const completionPercentage = totalChapters > 0 ? Math.round((completedChaptersCount / totalChapters) * 100) : 0;

      const updatedEnrollment = await this.updateOne(
        {
          userId,
          courseId,
          "completedChapters.chapterId": { $ne: chapterId },
        },
        {
          $addToSet: {
            completedChapters: {
              chapterId,
              isCompleted: true,
              completedAt: new Date(),
            },
          },
          $set: { completionPercentage },
        },
      );

      if (!updatedEnrollment) {
        const existing = await this.findOne(
          { userId, courseId, "completedChapters.chapterId": chapterId, "completedChapters.isCompleted": true },
          [
            {
              path: "courseId",
              populate: [{ path: "chapters" }, { path: "quizzes" }],
            },
          ],
        );
        return existing || null;
      }

      return this.findOne(
        { userId, courseId },
        [
          {
            path: "courseId",
            populate: [{ path: "chapters" }, { path: "quizzes" }],
          },
        ],
      );
    } catch (error) {
      appLogger.error("Error marking chapter completed:", error);
      throw error;
    }
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
    const enrollment = await this.findOne({ userId, courseId });
    if (!enrollment) return null;

    const quizIndex = enrollment.completedQuizzes.findIndex(
      (q) => q.quizId.toString() === quizData.quizId.toString(),
    );

    const updatedQuiz = { ...quizData, attemptedAt: new Date() };

    if (quizIndex !== -1) {
      enrollment.completedQuizzes[quizIndex] = updatedQuiz;
    } else {
      enrollment.completedQuizzes.push(updatedQuiz);
    }

    await enrollment.save();

    if (quizData.scorePercentage < 50) return enrollment;

    const fullEnrollment = await this.findOne(
      { userId, courseId },
      [
        {
          path: "courseId",
          populate: { path: "chapters" },
        },
      ],
    );

    if (!fullEnrollment || !fullEnrollment.courseId) return enrollment;

    const course = fullEnrollment.courseId as unknown as ICourse & { chapters: { length: number } };
    const totalChapters = Array.isArray(course.chapters) ? course.chapters.length : 0;
    const completedChaptersCount = fullEnrollment.completedChapters.filter((ch) => ch.isCompleted).length;

    if (totalChapters > 0 && completedChaptersCount !== totalChapters) return enrollment;
    if (fullEnrollment.certificateGenerated) return enrollment;

    const student = await this._studentRepository.findById(userId);
    if (!student || !student.username) return enrollment;

    const instructor = await this._instructorRepository.findById(course.instructorId.toString());
    const instructorName = instructor?.username || "Course Instructor";

    const certificateUrl = await generateCertificate({
      studentName: student.username,
      courseName: course.courseName,
      instructorName,
      userId: userId.toString(),
      courseId: courseId.toString(),
    });

    await this.updateOne(
      { userId, courseId },
      {
        certificateGenerated: true,
        certificateUrl,
        completionStatus: "COMPLETED",
      },
    );

    return this.findOne({ userId, courseId });
  }

  async areAllChaptersCompleted(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<boolean> {
    const enrollment = await this.findOne(
      { userId, courseId },
      [
        {
          path: "courseId",
          populate: { path: "chapters" },
        },
      ],
    );

    if (!enrollment || !enrollment.courseId) return false;

    const course = enrollment.courseId as unknown as ICourse & { chapters: { length: number } };
    const totalChapters = Array.isArray(course.chapters) ? course.chapters.length : 0;
    const completedCount = enrollment.completedChapters.filter((ch) => ch.isCompleted).length;

    return totalChapters > 0 && completedCount === totalChapters;
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<IEnrollment | null> {
    return this.findOne({ userId, courseId });
  }

  async findByUserAndCourseWithPopulate(
    userId: string,
    courseId: string,
    populateOptions: {
      path: string;
      populate?: { path: string }[];
    }[],
  ): Promise<IEnrollment | null> {
    return this.findOne({ userId, courseId }, populateOptions);
  }
}