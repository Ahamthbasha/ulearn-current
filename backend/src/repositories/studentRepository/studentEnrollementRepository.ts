import { Types } from "mongoose";
import { GenericRepository } from "../genericRepository";
import { IStudentEnrollmentRepository } from "./interface/IStudentEnrollmentRepository";
import { EnrollmentModel, IEnrollment } from "../../models/enrollmentModel";
import { generateCertificate } from "../../utils/certificateGenerator";
import { IStudentRepository } from "./interface/IStudentRepository";
import IInstructorRepository from "../instructorRepository/interface/IInstructorRepository";

export class StudentEnrollmentRepository
  extends GenericRepository<IEnrollment>
  implements IStudentEnrollmentRepository
{
  private _studentRepository: IStudentRepository;
  private _instructorRepository: IInstructorRepository;
  constructor(
    studentRepository: IStudentRepository,
    instructorRepository: IInstructorRepository,
  ) {
    super(EnrollmentModel);
    this._studentRepository = studentRepository;
    this._instructorRepository = instructorRepository;
  }

  async getAllEnrolledCourses(userId: Types.ObjectId): Promise<IEnrollment[]> {
    const result = await this.findAll({ userId }, ["courseId"]);
    return result || [];
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
    return this.findOneAndUpdate(
      {
        userId,
        courseId,
        "completedChapters.chapterId": { $ne: chapterId },
      },
      {
        $push: {
          completedChapters: {
            chapterId,
            isCompleted: true,
            completedAt: new Date(),
          },
        },
        $set: {
          completionStatus: "IN_PROGRESS",
        },
      },
      { new: true },
    );
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
    const completedChaptersCount = fullEnrollment.completedChapters.length;

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
    const enrollment = await EnrollmentModel.findOne({
      userId,
      courseId,
    }).populate({
      path: "courseId",
      populate: { path: "chapters" },
    });

    if (!enrollment || !enrollment.courseId) return false;

    const course: any = enrollment.courseId;
    const totalChapters = course.chapters?.length || 0;
    const completedCount = enrollment.completedChapters.length;

    return totalChapters > 0 && completedCount === totalChapters;
  }
}
