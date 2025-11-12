import { Types, FilterQuery, PopulateOptions } from "mongoose";
import { GenericRepository } from "../genericRepository";
import { IStudentEnrollmentRepository } from "./interface/IStudentEnrollmentRepository";
import { EnrollmentModel, IEnrollment } from "../../models/enrollmentModel";
import { generateCertificate } from "../../utils/certificateGenerator";
import { IStudentRepository } from "./interface/IStudentRepository";
import IInstructorRepository from "../instructorRepository/interface/IInstructorRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { IOrder } from "../../models/orderModel";
import { ICourseFullyPopulated } from "../../models/courseModel";

/** Populated enrollment with full course + modules + chapters */
type IPopulatedEnrollment = IEnrollment & {
  courseId: ICourseFullyPopulated;
};

export class StudentEnrollmentRepository
  extends GenericRepository<IEnrollment>
  implements IStudentEnrollmentRepository
{
  private readonly _studentRepo: IStudentRepository;
  private readonly _instructorRepo: IInstructorRepository;
  private readonly _orderRepo: IOrderRepository;

  constructor(
    studentRepo: IStudentRepository,
    instructorRepo: IInstructorRepository,
    orderRepo: IOrderRepository
  ) {
    super(EnrollmentModel);
    this._studentRepo = studentRepo;
    this._instructorRepo = instructorRepo;
    this._orderRepo = orderRepo;
  }

  async getAllEnrolledCourses(userId: Types.ObjectId) {
    const enrollments = await this.findAll(
      { userId, learningPathId: { $exists: false } },
      []
    );

    if (!enrollments.length) return [];

    const orders = await this._orderRepo.findByUser(userId);
    const orderMap = new Map<string, IOrder>();
    orders.forEach(o =>
      o.courses.forEach(c => orderMap.set(c.courseId.toString(), o))
    );

    return enrollments.map(e => ({
      enrollment: e,
      order: orderMap.get(e.courseId.toString())
    }));
  }

  // async getEnrollmentByCourseDetails(
  //   userId: Types.ObjectId,
  //   courseId: Types.ObjectId
  // ): Promise<IPopulatedEnrollment | null> {
  //   const populateOptions: PopulateOptions[] = [
  //     {
  //       path: "courseId",
  //       populate: {
  //         path: "modules",
  //         populate: [
  //           { path: "chapters", select: "chapterTitle videoUrl duration position _id" },
  //           { path: "quiz", select: "questions" }
  //         ]
  //       }
  //     }
  //   ];

  //   const result = await this.findOne(
  //     { userId, courseId } as FilterQuery<IEnrollment>,
  //     populateOptions
  //   );

  //   return result as IPopulatedEnrollment | null;
  // }

  async getEnrollmentByCourseDetails(
  userId: Types.ObjectId,
  courseId: Types.ObjectId
): Promise<IPopulatedEnrollment | null> {
  const populateOptions: PopulateOptions[] = [
    {
      path: "courseId",
      populate: {
        path: "modules",
        populate: [
          { path: "chapters", select: "chapterTitle videoUrl duration position _id" },
          { path: "quiz", select: "questions _id" }
        ]
      }
    }
  ];

  const result = await this.findOne(
    { userId, courseId } as FilterQuery<IEnrollment>,
    populateOptions
  );

  return result as IPopulatedEnrollment | null;
}

  async markChapterCompleted(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
    chapterId: Types.ObjectId
  ): Promise<IEnrollment & { courseId: any } | null> {
    const enrollment = await this.findOne({ userId, courseId } as FilterQuery<IEnrollment>);
    if (!enrollment) return null;

    const already = enrollment.completedChapters.some(
      c => c.chapterId.equals(chapterId) && c.isCompleted
    );
    if (already) return this.getEnrollmentByCourseDetails(userId, courseId);

    enrollment.completedChapters.push({
      chapterId,
      isCompleted: true,
      completedAt: new Date()
    });

    await enrollment.save();
    return this.getEnrollmentByCourseDetails(userId, courseId);
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
  ): Promise<IEnrollment & { courseId: any } | null> {
    const enrollment = await this.findOne({ userId, courseId } as FilterQuery<IEnrollment>);
    if (!enrollment) return null;

    const { quizId, correctAnswers, totalQuestions, scorePercentage } = quizData;
    const isPassed = scorePercentage >= 50;

    const idx = enrollment.completedQuizzes.findIndex(q => q.quizId.equals(quizId));
    const result = {
      quizId,
      correctAnswers,
      totalQuestions,
      scorePercentage,
      isPassed,
      attemptedAt: new Date()
    };

    if (idx >= 0) {
      enrollment.completedQuizzes[idx] = result;
    } else {
      enrollment.completedQuizzes.push(result);
    }

    await enrollment.save();

    if (enrollment.completionPercentage === 100 && !enrollment.certificateGenerated) {
      const populated = await this.getEnrollmentByCourseDetails(userId, courseId);
      if (!populated?.courseId) return enrollment;

      const student = await this._studentRepo.findById(userId);
      const instructor = await this._instructorRepo.findById(populated.courseId.instructorId.toString());

      const certificateUrl = await generateCertificate({
        studentName: student?.username ?? "Student",
        courseName: populated.courseId.courseName,
        instructorName: instructor?.username ?? "Instructor",
        userId: userId.toString(),
        courseId: courseId.toString()
      });

      await this.updateOne(
        { userId, courseId } as FilterQuery<IEnrollment>,
        { certificateGenerated: true, certificateUrl }
      );
    }

    return this.getEnrollmentByCourseDetails(userId, courseId);
  }

  async areAllChaptersCompleted(
    userId: Types.ObjectId,
    courseId: Types.ObjectId
  ): Promise<boolean> {
    const enrollment = await this.getEnrollmentByCourseDetails(userId, courseId);
    if (!enrollment?.courseId?.modules) return false;

    const allChapterIds = enrollment.courseId.modules
      .flatMap(m => m.chapters.map((c: any) => c._id.toString()));

    const completedIds = enrollment.completedChapters
      .filter(c => c.isCompleted)
      .map(c => c.chapterId.toString());

    return allChapterIds.every(id => completedIds.includes(id));
  }

  async findByUserAndCourse(userId: string, courseId: string) {
    return this.findOne({ userId, courseId } as FilterQuery<IEnrollment>);
  }

  async findByUserAndCourseWithPopulate(
    userId: string,
    courseId: string,
    populateOptions: PopulateOptions[]
  ) {
    return this.findOne({ userId, courseId } as FilterQuery<IEnrollment>, populateOptions);
  }

  // Override findOne to ensure correct typing
  async findOne(
    filter: FilterQuery<IEnrollment>,
    populate?: PopulateOptions | PopulateOptions[],
    session?: import("mongodb").ClientSession
  ): Promise<IEnrollment | null> {
    let query = this.model.findOne(filter);
    if (populate) {
      if (Array.isArray(populate)) {
        query = query.populate(populate);
      } else {
        query = query.populate(populate);
      }
    }
    if (session) query = query.session(session);
    return await query.exec();
  }
}