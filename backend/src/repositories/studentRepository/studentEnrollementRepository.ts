import { Types } from "mongoose";
import { GenericRepository } from "../genericRepository";
import { IStudentEnrollmentRepository } from "./interface/IStudentEnrollmentRepository";
import { EnrollmentModel, IEnrollment } from "../../models/enrollmentModel";
import { generateCertificate } from "../../utils/certificateGenerator";
import { IStudentRepository } from "./interface/IStudentRepository";
import IInstructorRepository from "../instructorRepository/interface/IInstructorRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { IOrder } from "../../models/orderModel";

export class StudentEnrollmentRepository
  extends GenericRepository<IEnrollment>
  implements IStudentEnrollmentRepository
{
  private _studentRepository: IStudentRepository;
  private _instructorRepository: IInstructorRepository;
  private _orderRepository: IOrderRepository;

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

  async getAllEnrolledCourses(userId: Types.ObjectId): Promise<{ enrollment: IEnrollment; order?: IOrder }[]> {
    const enrollments = await this.findAll(
      { userId, learningPathId: { $exists: false } },
      []
    );

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    // Fetch successful orders for the user
    const orders = await this._orderRepository.findByUser(userId);

    // Create a map of courseId to order for efficient lookup
    const orderMap = new Map<string, IOrder>();
    orders.forEach(order => {
      order.courses.forEach(course => {
        orderMap.set(course.courseId.toString(), order);
      });
    });

    // Match enrollments with orders
    const result = enrollments.map(enrollment => {
      const courseId = enrollment.courseId.toString();
      const matchingOrder = orderMap.get(courseId);
      return {
        enrollment,
        order: matchingOrder,
      };
    });

    return result;
  }

  async getEnrollmentByCourseDetails(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<IEnrollment | null> {
    return this.findOne({ userId, courseId }, [
      {
        path: "courseId",
        populate: [{ path: "chapters" }, { path: "quizzes" }],
      },
    ]);
  }

async markChapterCompleted(
  userId: Types.ObjectId,
  courseId: Types.ObjectId,
  chapterId: Types.ObjectId,
): Promise<IEnrollment | null> {
  try {
    // Fetch the enrollment with course chapters populated to get total chapters
    const enrollment = await this.findOne(
      { userId, courseId },
      [
        {
          path: "courseId",
          populate: { path: "chapters" },
        },
      ]
    );

    if (!enrollment || !enrollment.courseId) {
      console.log("Enrollment or course not found for userId:", userId, "courseId:", courseId);
      return null;
    }

    // Check if the chapter is already completed to avoid redundant updates
    const isChapterCompleted = enrollment.completedChapters.some(
      (ch) => ch.chapterId.equals(chapterId) && ch.isCompleted
    );

    if (isChapterCompleted) {
      console.log("Chapter already marked as completed:", chapterId);
      return enrollment;
    }

    // Get total chapters and completed chapters
    const course: any = enrollment.courseId;
    const totalChapters = Array.isArray(course.chapters) ? course.chapters.length : 0;
    const completedChaptersCount = enrollment.completedChapters.filter(
      (ch) => ch.isCompleted
    ).length + 1; // Add 1 for the new chapter being marked

    // Calculate completion percentage
    const completionPercentage = totalChapters > 0
      ? Math.round((completedChaptersCount / totalChapters) * 100)
      : 0;

    // Use an atomic update to either add a new chapter or update the existing one
    const updatedEnrollment = await this.updateOne(
      {
        userId,
        courseId,
        "completedChapters.chapterId": { $ne: chapterId }, // Only update if chapterId is not in completedChapters
      },
      {
        $addToSet: {
          completedChapters: {
            chapterId,
            isCompleted: true,
            completedAt: new Date(),
          },
        },
        $set: {
          completionPercentage,
        },
      }
    );

    if (!updatedEnrollment) {
      // If no update occurred, it might mean the chapterId already exists
      // Check if the chapter is already completed in the database
      const existingEnrollment = await this.findOne(
        {
          userId,
          courseId,
          "completedChapters.chapterId": chapterId,
          "completedChapters.isCompleted": true,
        },
        [
          {
            path: "courseId",
            populate: [{ path: "chapters" }, { path: "quizzes" }],
          },
        ]
      );

      if (existingEnrollment) {
        console.log("Chapter already marked as completed in database:", chapterId);
        return existingEnrollment;
      }

      console.log("Updated enrollment not found for userId:", userId, "courseId:", courseId);
      return null;
    }

    // Fetch the updated enrollment to return
    const finalEnrollment = await this.findOne(
      { userId, courseId },
      [
        {
          path: "courseId",
          populate: [{ path: "chapters" }, { path: "quizzes" }],
        },
      ]
    );

    if (!finalEnrollment) {
      console.log("Final enrollment not found for userId:", userId, "courseId:", courseId);
      return null;
    }

    return finalEnrollment;
  } catch (error) {
    console.error("Error marking chapter completed:", error);
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
    console.log("📥 Submitting quiz result:", quizData);

    const enrollment = await this.findOne({ userId, courseId });
    if (!enrollment) {
      console.log("Enrollment not found during quiz submission");
      return null;
    }

    // Check if the quiz already exists and update it if so
    const quizIndex = enrollment.completedQuizzes.findIndex(
      (q) => q.quizId.toString() === quizData.quizId.toString(),
    );

    const updatedQuiz = {
      ...quizData,
      attemptedAt: new Date(),
    };

    if (quizIndex !== -1) {
      enrollment.completedQuizzes[quizIndex] = updatedQuiz;
    } else {
      enrollment.completedQuizzes.push(updatedQuiz);
    }

    await enrollment.save();

    if (quizData.scorePercentage < 50) {
      console.log("Score is below 50%, certificate will not be generated.");
      return enrollment;
    }

    const fullEnrollment = await this.findOne(
      { userId, courseId },
      {
        path: "courseId",
        populate: { path: "chapters" },
      },
    );

    if (!fullEnrollment || !fullEnrollment.courseId) {
      console.log("Full enrollment or course data is missing.");
      return enrollment;
    }

    const course: any = fullEnrollment.courseId;
    const totalChapters = Array.isArray(course.chapters)
      ? course.chapters.length
      : 0;
    const completedChaptersCount = fullEnrollment.completedChapters.filter(
      (ch) => ch.isCompleted,
    ).length;

    const allChaptersCompleted =
      totalChapters > 0 && completedChaptersCount === totalChapters;

    if (!allChaptersCompleted) {
      console.log(
        "Not all chapters are completed. Certificate will not be generated.",
      );
      return enrollment;
    }

    if (fullEnrollment.certificateGenerated) {
      console.log("Certificate already generated. Skipping generation.");
      return enrollment;
    }

    const student = await this._studentRepository.findById(userId);
    if (!student || !student.username) {
      console.log("Student or student username not found");
      return enrollment;
    }

    const instructor = await this._instructorRepository.findById(
      course.instructorId,
    );
    const instructorName = instructor?.username || "Course Instructor";

    console.log("All conditions met. Generating certificate...");

    const certificateUrl = await generateCertificate({
      studentName: student.username,
      courseName: course.courseName,
      instructorName,
      userId: userId.toString(),
      courseId: courseId.toString(),
    });

    console.log("Certificate generated:", certificateUrl);

    await this.updateOne(
      { userId, courseId },
      {
        certificateGenerated: true,
        certificateUrl,
        completionStatus: "COMPLETED",
      },
    );

    console.log("Enrollment updated with certificate data.");

    return await this.findOne({ userId, courseId });
  }

  async areAllChaptersCompleted(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<boolean> {
    const enrollment = await this.findOne(
      { userId, courseId },
      {
        path: "courseId",
        populate: { path: "chapters" },
      }
    );

    if (!enrollment || !enrollment.courseId) return false;

    const course: any = enrollment.courseId;
    const totalChapters = course.chapters?.length || 0;
    const completedCount = enrollment.completedChapters.filter(
      (ch) => ch.isCompleted,
    ).length;

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
    populateOptions: any[],
  ): Promise<IEnrollment | null> {
    return this.findOne({ userId, courseId }, populateOptions);
  }
}
