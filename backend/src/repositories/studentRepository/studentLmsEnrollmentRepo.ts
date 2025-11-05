import { Types } from "mongoose";
import { ILearningPath } from "../../models/learningPathModel";
import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
import { ICourse } from "../../models/courseModel";
import { IStudentLmsEnrollmentRepo } from "./interface/IStudentLmsEnrollmentRepo";
import { ILearningPathRepository } from "../interfaces/ILearningPathRepository";
import { ILearningPathEnrollmentRepo } from "../interfaces/ILearningPathEnrollmentRepo";
import { IStudentEnrollmentRepository } from "../studentRepository/interface/IStudentEnrollmentRepository";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { isPresignedUrl } from "../../utils/isPresignedUrl";
import { IStudentRepository } from "../studentRepository/interface/IStudentRepository";
import { generateCertificate } from "../../utils/certificateGenerator";
// import {
//   ICompletedChapter,
//   ICompletedQuiz,
// } from "../../models/enrollmentModel";
// import { IChapter } from "../../models/chapterModel";
// import { IQuiz } from "../../models/quizModel";
import { IOrderRepository } from "../interfaces/IOrderRepository";

export class StudentLmsEnrollmentRepo implements IStudentLmsEnrollmentRepo {
  private _learningPathRepo: ILearningPathRepository;
  private _learningPathEnrollmentRepo: ILearningPathEnrollmentRepo;
  private _studentRepository: IStudentRepository;
  // private _instructorRepository: IInstructorRepository;
  private _enrollmentRepository: IStudentEnrollmentRepository;
  private _orderRepository: IOrderRepository;

  constructor(
    learningPathRepo: ILearningPathRepository,
    learningPathEnrollmentRepo: ILearningPathEnrollmentRepo,
    studentRepository: IStudentRepository,
    // instructorRepository: IInstructorRepository,
    enrollmentRepository: IStudentEnrollmentRepository,
    orderRepository: IOrderRepository,
  ) {
    this._learningPathRepo = learningPathRepo;
    this._learningPathEnrollmentRepo = learningPathEnrollmentRepo;
    this._studentRepository = studentRepository;
    // this._instructorRepository = instructorRepository;
    this._enrollmentRepository = enrollmentRepository;
    this._orderRepository = orderRepository;
  }

  async getEnrolledLearningPaths(userId: Types.ObjectId): Promise<
    Array<{
      learningPath: ILearningPath & {
        noOfCourses?: number;
        noOfHours?: number;
        totalCompletionPercentageOfLearningPath?: number;
      };
      enrollment: ILearningPathEnrollment;
    }>
  > {
    try {
      const enrollments = await this._learningPathEnrollmentRepo.find(
        { userId },
        [
          {
            path: "learningPathId",
            select: "title description thumbnailUrl category items",
            populate: [
              { path: "categoryDetails", select: "name" },
              { path: "items.courseId", select: "duration" },
            ],
          },
        ],
      );

      const orders = await this._orderRepository.findByUser(userId);

      const result = await Promise.all(
        enrollments
          .filter(
            (
              enrollment,
            ): enrollment is ILearningPathEnrollment & {
              learningPathId: ILearningPath;
            } => enrollment.learningPathId != null,
          )
          .map(async (enrollment) => {
            const learningPath = enrollment.learningPathId;
            const presignedThumbnailUrl =
              learningPath.thumbnailUrl &&
              !isPresignedUrl(learningPath.thumbnailUrl)
                ? await getPresignedUrl(learningPath.thumbnailUrl)
                : (learningPath.thumbnailUrl ?? "");
            const noOfCourses = learningPath.items?.length ?? 0;
            const noOfHours =
              learningPath.items?.reduce((total, item) => {
                const course = item.courseId as ICourse;
                return total + (Number(course?.duration) || 0);
              }, 0) ?? 0;

            // Calculate totalCompletionPercentageOfLearningPath
            let totalCompletionPercentageOfLearningPath = 0;
            if (learningPath.items?.length) {
              const courseIds = learningPath.items.map((item) =>
                item.courseId instanceof Types.ObjectId
                  ? item.courseId
                  : item.courseId._id,
              );
              const courseEnrollments = await Promise.all(
                courseIds.map(async (courseId) => {
                  const courseEnrollment =
                    await this._enrollmentRepository.findByUserAndCourse(
                      userId.toString(),
                      courseId.toString(),
                    );
                  return courseEnrollment?.completionPercentage ?? 0;
                }),
              );
              const totalCompletion = courseEnrollments.reduce(
                (sum, percentage) => sum + percentage,
                0,
              );
              totalCompletionPercentageOfLearningPath =
                courseEnrollments.length > 0
                  ? Math.round(totalCompletion / courseEnrollments.length)
                  : 0;
            }

            // Fetch totalPrice from OrderModel
            const order = orders.find((o) =>
              o.learningPaths.some((lp) =>
                lp.learningPathId.equals(learningPath._id),
              ),
            );
            const learningPathOrder = order?.learningPaths.find((lp) =>
              lp.learningPathId.equals(learningPath._id),
            );
            const totalPrice = learningPathOrder?.totalPrice ?? 0;

            const modifiedLearningPath = {
              ...learningPath.toObject(),
              thumbnailUrl: presignedThumbnailUrl,
              totalPrice, // Use price from OrderModel
              noOfCourses,
              noOfHours,
              totalCompletionPercentageOfLearningPath,
            };
            return {
              learningPath: modifiedLearningPath as ILearningPath & {
                noOfCourses?: number;
                noOfHours?: number;
                totalCompletionPercentageOfLearningPath?: number;
              },
              enrollment,
            };
          }),
      );
      return result;
    } catch (error) {
      throw new Error(
        `Failed to fetch enrolled learning paths: ${(error as Error).message}`,
      );
    }
  }

  async getLearningPathDetails(
    userId: Types.ObjectId,
    learningPathId: Types.ObjectId,
  ): Promise<{
    learningPath: ILearningPath;
    enrollment: ILearningPathEnrollment;
    courses: Array<
      ICourse & { certificateUrl?: string; completionPercentage?: number }
    >;
  }> {
    try {
      const enrollment = await this._learningPathEnrollmentRepo.findOne({
        userId,
        learningPathId,
      });
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }
      const learningPath = await this._learningPathRepo.findByIdWithPopulate(
        learningPathId.toString(),
        [
          {
            path: "courses",
            select: "courseName description thumbnailUrl chapters quizzes",
          },
          { path: "categoryDetails", select: "name" },
        ],
      );
      if (!learningPath) {
        throw new Error("Learning path not found");
      }

      // Fetch totalPrice from OrderModel
      const order = await this._orderRepository.findByUserAndLearningPath(
        userId,
        learningPathId,
      );
      const learningPathOrder = order?.learningPaths.find((lp) =>
        lp.learningPathId.equals(learningPathId),
      );
      const totalPrice = learningPathOrder?.totalPrice ?? 0;

      const coursesWithPresignedUrls = await Promise.all(
        (learningPath.courses || []).map(async (course) => {
          const presignedThumbnailUrl =
            course.thumbnailUrl && !isPresignedUrl(course.thumbnailUrl)
              ? await getPresignedUrl(course.thumbnailUrl)
              : (course.thumbnailUrl ?? "");

          const courseEnrollment =
            await this._enrollmentRepository.findByUserAndCourse(
              userId.toString(),
              course._id.toString(),
            );
          let certificateUrl: string | undefined;
          let completionPercentage: number | undefined;
          if (courseEnrollment) {
            if (
              courseEnrollment.certificateGenerated &&
              courseEnrollment.certificateUrl
            ) {
              certificateUrl = await getPresignedUrl(
                courseEnrollment.certificateUrl,
              );
            }
            completionPercentage = courseEnrollment.completionPercentage ?? 0;
          }

          // Fetch coursePrice from OrderModel
          const courseOrder = learningPathOrder?.courses.find((c) =>
            c.courseId.equals(course._id),
          );
          const coursePrice = courseOrder?.coursePrice ?? course.price;

          return {
            ...course.toObject(),
            thumbnailUrl: presignedThumbnailUrl,
            price: coursePrice,
            effectivePrice:
              courseOrder?.offerPrice ?? course.effectivePrice ?? coursePrice,
            certificateUrl,
            completionPercentage,
          };
        }),
      );

      const learningPathThumbnailUrl =
        learningPath.thumbnailUrl && !isPresignedUrl(learningPath.thumbnailUrl)
          ? await getPresignedUrl(learningPath.thumbnailUrl)
          : (learningPath.thumbnailUrl ?? "");

      return {
        learningPath: {
          ...learningPath.toObject(),
          thumbnailUrl: learningPathThumbnailUrl,
          totalPrice,
        },
        enrollment,
        courses: coursesWithPresignedUrls as Array<
          ICourse & { certificateUrl?: string; completionPercentage?: number }
        >,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch learning path details: ${(error as Error).message}`,
      );
    }
  }

  async updateUnlockedOrder(
    enrollmentId: Types.ObjectId,
    unlockedOrder: number,
  ): Promise<ILearningPathEnrollment> {
    try {
      const enrollment = await this._learningPathEnrollmentRepo.updateOne(
        { _id: enrollmentId },
        { unlockedOrder },
        { new: true },
      );
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }
      return enrollment;
    } catch (error) {
      throw new Error(
        `Failed to update unlocked order: ${(error as Error).message}`,
      );
    }
  }

  async markCourseCompleted(
    enrollmentId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<ILearningPathEnrollment> {
    try {
      const enrollment = await this._learningPathEnrollmentRepo.findById(
        enrollmentId.toString(),
      );
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }
      const learningPath = await this._learningPathRepo.findById(
        enrollment.learningPathId.toString(),
      );
      if (!learningPath) {
        throw new Error("Learning path not found");
      }
      // Check if the course is part of the learning path
      const courseItem = learningPath.items.find((item) => {
        if (item.courseId instanceof Types.ObjectId) {
          return item.courseId.equals(courseId);
        }
        return (item.courseId as ICourse)._id.equals(courseId);
      });
      if (!courseItem) {
        throw new Error("Course not found in learning path");
      }
      // Verify course completion using EnrollmentRepository
      const courseEnrollment =
        await this._enrollmentRepository.findByUserAndCourse(
          (enrollment.userId as Types.ObjectId).toString(),
          (courseId as Types.ObjectId).toString(),
        );
      if (!courseEnrollment || !courseEnrollment.courseId) {
        throw new Error("Course enrollment not found");
      }
      // Populate to check chapters and quizzes
      const populatedEnrollment =
        await this._enrollmentRepository.findByUserAndCourseWithPopulate(
          (enrollment.userId as Types.ObjectId).toString(),
          (courseId as Types.ObjectId).toString(),
          [
  {
    path: "courseId",
    populate: [
      { path: "chapters" },
      { path: "quizzes" },
    ],
  },
]
        );
      if (!populatedEnrollment || !populatedEnrollment.courseId) {
        throw new Error("Populated course enrollment not found");
      }
      // const course =
      //   populatedEnrollment.courseId as unknown as IPopulatedCourse;
      // const allChaptersCompleted =
      //   course.chapters?.length > 0 &&
      //   course.chapters.every((chapter: IChapter) =>
      //     populatedEnrollment.completedChapters.some(
      //       (cc: ICompletedChapter) =>
      //         cc.chapterId.equals(chapter._id) && cc.isCompleted,
      //     ),
      //   );
      // const allQuizzesCompleted =
      //   course.quizzes?.length > 0
      //     ? course.quizzes.every((quiz: IQuiz) =>
      //         populatedEnrollment.completedQuizzes.some(
      //           (cq: ICompletedQuiz) =>
      //             cq.quizId.equals(quiz._id) && cq.scorePercentage >= 50,
      //         ),
      //       )
      //     : true;
      // if (!allChaptersCompleted || !allQuizzesCompleted) {
      //   throw new Error(
      //     "Not all chapters or quizzes are completed for this course",
      //   );
      // }
      // Mark course as completed in LearningPathEnrollment
      const completedCourse = enrollment.completedCourses.find((cc) =>
        cc.courseId.equals(courseId),
      );
      if (completedCourse) {
        completedCourse.isCompleted = true;
        completedCourse.completedAt = new Date();
      } else {
        enrollment.completedCourses.push({
          courseId,
          isCompleted: true,
          completedAt: new Date(),
        });
      }

      const totalCourses = learningPath.items.length;
      const completedCourses = enrollment.completedCourses.filter(
        (cc) => cc.isCompleted,
      ).length;
      if (completedCourses === totalCourses) {
        enrollment.completionStatus = "COMPLETED";
      } else if (completedCourses > 0) {
        enrollment.completionStatus = "IN_PROGRESS";
      }
      if (
        enrollment.completionStatus === "COMPLETED" &&
        !enrollment.certificateGenerated
      ) {
        const student = await this._studentRepository.findById(
          enrollment.userId,
        );
        if (!student || !student.username) {
          throw new Error("Student or student username not found");
        }
        // const instructor = await this._instructorRepository.findById(
        //   learningPath.instructorId.toString(),
        // );
        // const instructorName = instructor?.username || "Course Instructor";
        const certificateUrl = await this.generateLearningPathCertificate(
          enrollment._id as Types.ObjectId,
          student.username,
          learningPath.title,
          "tempo"
          // instructorName,
        );
        enrollment.certificateGenerated = true;
        enrollment.certificateUrl = certificateUrl;
      }
      const updatedEnrollment =
        await this._learningPathEnrollmentRepo.updateOne(
          { _id: enrollmentId },
          {
            completedCourses: enrollment.completedCourses,
            completionStatus: enrollment.completionStatus,
            certificateGenerated: enrollment.certificateGenerated,
            certificateUrl: enrollment.certificateUrl,
          },
          { new: true },
        );
      if (!updatedEnrollment) {
        throw new Error("Failed to update enrollment");
      }
      return updatedEnrollment;
    } catch (error) {
      throw new Error(
        `Failed to mark course as completed: ${(error as Error).message}`,
      );
    }
  }

  async generateLearningPathCertificate(
    enrollmentId: Types.ObjectId,
    studentName: string,
    learningPathTitle: string,
    instructorName: string,
  ): Promise<string> {
    try {
      const enrollment = await this._learningPathEnrollmentRepo.findById(
        enrollmentId.toString(),
      );
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }
      const certificateUrl = await generateCertificate({
        studentName,
        courseName: learningPathTitle,
        instructorName,
        userId: enrollment.userId.toString(),
        courseId: enrollment.learningPathId.toString(),
      });
      return certificateUrl;
    } catch (error) {
      throw new Error(
        `Failed to generate certificate: ${(error as Error).message}`,
      );
    }
  }
}
