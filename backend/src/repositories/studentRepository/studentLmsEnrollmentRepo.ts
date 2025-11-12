import { Types } from "mongoose";
import { ILearningPath, ILearningPathItem,  } from "../../models/learningPathModel";
import {  ILearningPathCompletedCourse, ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
import { ICourse } from "../../models/courseModel";
import { IStudentLmsEnrollmentRepo } from "./interface/IStudentLmsEnrollmentRepo";
import { ILearningPathRepository } from "../interfaces/ILearningPathRepository";
import { ILearningPathEnrollmentRepo } from "../interfaces/ILearningPathEnrollmentRepo";
import { IStudentEnrollmentRepository } from "../studentRepository/interface/IStudentEnrollmentRepository";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { isPresignedUrl } from "../../utils/isPresignedUrl";
import { IStudentRepository } from "../studentRepository/interface/IStudentRepository";
import { generateCertificate } from "../../utils/certificateGenerator";
import { IChapter } from "../../models/chapterModel";
import { IQuiz } from "../../models/quizModel";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import IInstructorRepository from "../instructorRepository/interface/IInstructorRepository";
import { ICourseRepository } from "../interfaces/ICourseRepository";
import { ICompletedChapter, ICompletedQuiz } from "../../models/enrollmentModel";
import { appLogger } from "../../utils/logger";
import { EnrichedCourse,PopulatedItem } from "../../interface/studentInterface/ILmsDetailInterface";

export class StudentLmsEnrollmentRepo implements IStudentLmsEnrollmentRepo {
  private _learningPathRepo: ILearningPathRepository;
  private _learningPathEnrollmentRepo: ILearningPathEnrollmentRepo;
  private _studentRepository: IStudentRepository;
  private _instructorRepository: IInstructorRepository;
  private _enrollmentRepository: IStudentEnrollmentRepository;
  private _orderRepository: IOrderRepository;
  private _courseRepository:ICourseRepository;

  constructor(
    learningPathRepo: ILearningPathRepository,
    learningPathEnrollmentRepo: ILearningPathEnrollmentRepo,
    studentRepository: IStudentRepository,
    instructorRepository: IInstructorRepository,
    enrollmentRepository: IStudentEnrollmentRepository,
    orderRepository: IOrderRepository,
    courseRepository:ICourseRepository
  ) {
    this._learningPathRepo = learningPathRepo;
    this._learningPathEnrollmentRepo = learningPathEnrollmentRepo;
    this._studentRepository = studentRepository;
    this._instructorRepository = instructorRepository;
    this._enrollmentRepository = enrollmentRepository;
    this._orderRepository = orderRepository;
    this._courseRepository = courseRepository
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
  learningPath: ILearningPath & { thumbnailUrl: string; totalPrice: number };
  enrollment: ILearningPathEnrollment;
  courses: EnrichedCourse[];
}> {
  try {
    // 1. Validate IDs
    if (!Types.ObjectId.isValid(userId)) throw new Error("Invalid user ID");
    if (!Types.ObjectId.isValid(learningPathId)) throw new Error("Invalid learning path ID");

    // 2. Fetch enrollment
    const enrollmentDoc = await this._learningPathEnrollmentRepo.findOne({
      userId,
      learningPathId,
    });
    if (!enrollmentDoc) throw new Error("Enrollment not found");
    const enrollment = enrollmentDoc as ILearningPathEnrollment & { _id: Types.ObjectId };

    // 3. Fetch populated learning path
    const lpDoc = await this._learningPathRepo.findByIdPopulated(
      learningPathId.toString(),
      [
        {
          path: "items.courseId",
          select: "courseName description thumbnailUrl instructorId price effectivePrice duration",
        },
        { path: "category", select: "name" },
      ],
    );
    if (!lpDoc) throw new Error("Learning path not found");

    // 4. Build clean item list
    const itemWithCourse: PopulatedItem[] = (lpDoc.items ?? [])
      .filter(
        (it): it is ILearningPathItem & { courseId: ICourse } =>
          !!it.courseId && "courseName" in (it.courseId as any),
      )
      .map((it) => ({
        order: it.order,
        course: it.courseId as ICourse,
      }));

    if (itemWithCourse.length === 0) {
      throw new Error("No valid courses in learning path");
    }

    // 5. Sync unlocked courses
    const completedSet = new Set(
      enrollment.completedCourses
        .filter((c): c is ILearningPathCompletedCourse & { isCompleted: true } => c.isCompleted)
        .map((c) => c.courseId.toString()),
    );

    const unlockedSet = new Set(enrollment.unlockedCourses.map((id) => id.toString()));
    let maxOrder = enrollment.unlockedOrder;
    let needsUpdate = false;

    const first = itemWithCourse[0];
    if (first && !unlockedSet.has(first.course._id.toString())) {
      unlockedSet.add(first.course._id.toString());
      needsUpdate = true;
    }

    for (const { order, course } of itemWithCourse) {
      const cid = course._id.toString();
      if (completedSet.has(cid)) {
        if (!unlockedSet.has(cid)) {
          unlockedSet.add(cid);
          needsUpdate = true;
        }
        const next = itemWithCourse.find((i) => i.order === order + 1);
        if (next && maxOrder < next.order) {
          maxOrder = next.order;
          const nextId = next.course._id.toString();
          if (!unlockedSet.has(nextId)) {
            unlockedSet.add(nextId);
            needsUpdate = true;
          }
        }
      }
    }

    if (needsUpdate) {
      enrollment.unlockedOrder = maxOrder;
      enrollment.unlockedCourses = Array.from(unlockedSet).map((id) => new Types.ObjectId(id));

      await this._learningPathEnrollmentRepo.updateOne(
        { _id: enrollment._id },
        {
          $set: {
            unlockedOrder: maxOrder,
            unlockedCourses: enrollment.unlockedCourses,
          },
        },
      );
    }

    // 6. Get total price
    const order = await this._orderRepository.findByUserAndLearningPath(userId, learningPathId);
    const lpOrder = order?.learningPaths.find((lp) => lp.learningPathId.equals(learningPathId));
    const totalPrice = lpOrder?.totalPrice ?? 0;

    // 7. Enrich courses → convert to plain object
    const courses: EnrichedCourse[] = await Promise.all(
      itemWithCourse.map(async ({ order, course }) => {
        const plainCourse = course.toObject(); // ← CRITICAL: removes Mongoose methods

        const thumbnailUrl =
          plainCourse.thumbnailUrl && !isPresignedUrl(plainCourse.thumbnailUrl)
            ? await getPresignedUrl(plainCourse.thumbnailUrl)
            : plainCourse.thumbnailUrl ?? "";

        const courseEnroll = await this._enrollmentRepository.findByUserAndCourse(
          userId.toString(),
          course._id.toString(),
        );

        let certificateUrl: string | undefined;
        let completionPercentage = 0;

        if (courseEnroll) {
          if (courseEnroll.certificateGenerated && courseEnroll.certificateUrl) {
            certificateUrl = await getPresignedUrl(courseEnroll.certificateUrl);
          }
          completionPercentage = courseEnroll.completionPercentage ?? 0;
        }

        const orderItem = lpOrder?.courses.find((c) => c.courseId.equals(course._id));
        const price = orderItem?.coursePrice ?? plainCourse.price;
        const effectivePrice = orderItem?.offerPrice ?? plainCourse.effectivePrice ?? price;

        return {
          ...plainCourse,
          order,
          thumbnailUrl,
          price,
          effectivePrice,
          certificateUrl,
          completionPercentage,
        } as EnrichedCourse;
      }),
    );

    // 8. Presign LP thumbnail
    const lpThumbnail =
      lpDoc.thumbnailUrl && !isPresignedUrl(lpDoc.thumbnailUrl)
        ? await getPresignedUrl(lpDoc.thumbnailUrl)
        : lpDoc.thumbnailUrl ?? "";

    // 9. Return
    return {
      learningPath: {
        ...lpDoc.toObject(),
        thumbnailUrl: lpThumbnail,
        totalPrice,
        courses: undefined,
        categoryDetails: lpDoc.category,
      },
      enrollment,
      courses,
    };
  } catch (err: any) {
    appLogger.error("getLearningPathDetails error", err);
    throw new Error(`Failed to fetch learning path details: ${err.message}`);
  }
}

async markCourseCompleted(
  enrollmentId: Types.ObjectId,
  courseId: Types.ObjectId,
): Promise<ILearningPathEnrollment> {
  try {
    const lpEnrollment = await this._learningPathEnrollmentRepo.findById(
      enrollmentId.toString(),
    );
    if (!lpEnrollment) throw new Error("Learning-path enrollment not found");

    const learningPath = await this._learningPathRepo.findById(
      lpEnrollment.learningPathId.toString(),
    );
    if (!learningPath) throw new Error("Learning path not found");

    const courseItem = learningPath.items.find((i) => {
      const id =
        i.courseId instanceof Types.ObjectId ? i.courseId : (i.courseId as ICourse)._id;
      return id.equals(courseId);
    });
    if (!courseItem) throw new Error("Course not part of this learning path");

    const courseEnrollment = await this._enrollmentRepository.findByUserAndCourse(
      lpEnrollment.userId.toString(),
      courseId.toString(),
    );
    if (!courseEnrollment) throw new Error("Course enrollment not found");

    const courseDoc = await this._courseRepository.findById(courseId.toString());
    if (!courseDoc) throw new Error("Course document not found");

    const populatedCourse = await courseDoc
      .populate<{
        modules: Array<{
          chapters: IChapter[];
          quiz?: IQuiz | null;
        }>;
      }>({
        path: "modules",
        populate: [
          { path: "chapters", select: "_id" },
          { path: "quiz", select: "_id" },
        ],
      })
      .then((doc) => doc?.toObject());

    if (!populatedCourse?.modules) {
      throw new Error("Course structure could not be loaded");
    }

    const totalLectures = populatedCourse.modules.reduce(
      (sum: number, m: { chapters?: IChapter[] }) => sum + (m.chapters?.length ?? 0),
      0,
    );

    const totalQuizzes = populatedCourse.modules.filter(
      (m: { quiz?: IQuiz | null }): boolean => m.quiz !== undefined && m.quiz !== null
    ).length;

    const totalItems = totalLectures + totalQuizzes;

    const completedLectures = courseEnrollment.completedChapters.filter(
      (c): c is ICompletedChapter & { isCompleted: true } => c.isCompleted,
    ).length;

    const passedQuizzes = courseEnrollment.completedQuizzes.filter(
      (q): q is ICompletedQuiz & { isPassed: true } => q.isPassed,
    ).length;

    const completedItems = completedLectures + passedQuizzes;

    const isFullyCompleted = totalItems > 0 && completedItems === totalItems;
    if (!isFullyCompleted) {
      throw new Error(
        "All chapters and quizzes must be completed before marking the course as finished in the learning path",
      );
    }

    const existing = lpEnrollment.completedCourses.find((c) =>
      c.courseId.equals(courseId),
    );
    if (existing) {
      existing.isCompleted = true;
      existing.completedAt = new Date();
    } else {
      lpEnrollment.completedCourses.push({
        courseId,
        isCompleted: true,
        completedAt: new Date(),
      });
    }

    const totalCourses = learningPath.items.length;
    const completedCoursesCount = lpEnrollment.completedCourses.filter(
      (c): c is ILearningPathCompletedCourse & { isCompleted: true } => c.isCompleted,
    ).length;

    lpEnrollment.completionStatus =
      completedCoursesCount === totalCourses
        ? "COMPLETED"
        : completedCoursesCount > 0
          ? "IN_PROGRESS"
          : "NOT_STARTED";

    if (
      lpEnrollment.completionStatus === "COMPLETED" &&
      !lpEnrollment.certificateGenerated
    ) {
      const student = await this._studentRepository.findById(lpEnrollment.userId);
      if (!student?.username) throw new Error("Student username missing");

      const instructor = await this._instructorRepository.findById(
        populatedCourse.instructorId.toString(),
      );
      const instructorName = instructor?.username ?? "Course Instructor";

      const certUrl = await this.generateLearningPathCertificate(
        lpEnrollment._id as Types.ObjectId,
        student.username,
        learningPath.title,
        instructorName,
      );
      lpEnrollment.certificateGenerated = true;
      lpEnrollment.certificateUrl = certUrl;
    }

    const updated = await this._learningPathEnrollmentRepo.updateOne(
      { _id: enrollmentId },
      {
        completedCourses: lpEnrollment.completedCourses,
        completionStatus: lpEnrollment.completionStatus,
        certificateGenerated: lpEnrollment.certificateGenerated,
        certificateUrl: lpEnrollment.certificateUrl,
      },
      { new: true },
    );

    if (!updated) throw new Error("Failed to persist learning-path enrollment");
    return updated;
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
