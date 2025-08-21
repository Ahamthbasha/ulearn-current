import { Response } from "express";
import { IStudentEnrollmentController } from "./interfaces/IStudentEnrollmentController";
import { IStudentEnrollmentService } from "../../services/studentServices/interface/IStudentEnrollmentService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { Types } from "mongoose";
import {
  EnrolledErrorMessage,
  StudentErrorMessages,
  StudentSuccessMessages,
} from "../../utils/constants";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export class StudentEnrollmentController
  implements IStudentEnrollmentController
{
  private _enrollmentService: IStudentEnrollmentService;

  constructor(enrollmentService: IStudentEnrollmentService) {
    this._enrollmentService = enrollmentService;
  }

  async getAllEnrolledCourses(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const courses =
        await this._enrollmentService.getAllEnrolledCourses(userId);

      // Presign thumbnail URLs
      for (const enroll of courses) {
        const course: any = enroll.courseId;
        if (course?.thumbnailUrl) {
          course.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
        }
      }

      res.status(StatusCode.OK).json({ success: true, courses });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: EnrolledErrorMessage.FAILED_TO_FETCH_ENROLLED_COURSES,
      });
    }
  }

  async getEnrollmentCourseDetails(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const courseId = new Types.ObjectId(req.params.courseId);

      const enrollment =
        await this._enrollmentService.getEnrollmentCourseWithDetails(
          userId,
          courseId,
        );

      if (!enrollment) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.STUDENT_ENROLLMENT_NOT_FOUND,
        });
        return;
      }

      const course: any = enrollment.courseId;

      // ✅ Presign course thumbnail
      if (course.thumbnailUrl) {
        course.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
      }

      // ✅ Presign demo video
      if (course.demoVideo?.url) {
        course.demoVideo.url = await getPresignedUrl(course.demoVideo.url);
      }

      // ✅ Presign chapter videos
      if (course.chapters?.length > 0) {
        for (const chapter of course.chapters) {
          if (chapter.videoUrl) {
            chapter.videoUrl = await getPresignedUrl(chapter.videoUrl);
          }
        }
      }

      console.log("enrollment", enrollment);

      res.status(StatusCode.OK).json({ success: true, enrollment });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: EnrolledErrorMessage.FAILED_TO_FETCH_PARTICULAR_COURSE,
      });
    }
  }

  async completeChapter(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const { courseId, chapterId } = req.body;

      const updatedEnrollment = await this._enrollmentService.completeChapter(
        userId,
        new Types.ObjectId(courseId),
        new Types.ObjectId(chapterId),
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.CHAPTER_COMPLETED,
        enrollment: updatedEnrollment,
      });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: EnrolledErrorMessage.FAILED_TO_MARK_CHAPTER_COMPLETED,
      });
    }
  }

  async submitQuizResult(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const { courseId, quizId, correctAnswers, totalQuestions } = req.body;

      if (
        !courseId ||
        !quizId ||
        correctAnswers == null ||
        totalQuestions == null
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.QUIZ_DATA_MISSING,
        });
        return;
      }

      const scorePercentage = (correctAnswers / totalQuestions) * 100;

      const enrollment = await this._enrollmentService.submitQuizResult(
        userId,
        new Types.ObjectId(courseId),
        {
          quizId: new Types.ObjectId(quizId),
          correctAnswers,
          totalQuestions,
          scorePercentage,
        },
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.QUIZ_RESULT_SUBMITTED,
        enrollment,
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_SUBMIT_QUIZ_RESULT,
      });
    }
  }

  async checkAllChaptersCompleted(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const courseId = new Types.ObjectId(req.params.courseId);

      const allCompleted =
        await this._enrollmentService.areAllChaptersCompleted(userId, courseId);

      res.status(StatusCode.OK).json({ success: true, allCompleted });
    } catch (err) {
      console.log(err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_CHECK_CHAPTER_COMPLETION,
      });
    }
  }

  async getCertificateUrl(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(req.user?.id);
      const courseId = new Types.ObjectId(req.params.courseId);

      const enrollment =
        await this._enrollmentService.getEnrollmentCourseWithDetails(
          userId,
          courseId,
        );

      if (
        !enrollment ||
        !enrollment.certificateGenerated ||
        !enrollment.certificateUrl
      ) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.CERTIFICATE_NOT_AVAILABLE,
        });
        return;
      }

      const presignedCertificateUrl = await getPresignedUrl(
        enrollment.certificateUrl,
      );

      res.status(StatusCode.OK).json({
        success: true,
        certificateUrl: presignedCertificateUrl,
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_FETCH_CERTIFICATE,
      });
    }
  }
}
