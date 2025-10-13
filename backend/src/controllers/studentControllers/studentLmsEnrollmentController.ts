import { Response } from "express";
import { IStudentLmsEnrollmentService } from "../../services/studentServices/interface/IStudentLmsEnrollmentService";
import { IStudentLmsEnrollmentController } from "./interfaces/IStudentLmsEnrollmentController";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { StatusCode } from "../../utils/enums";
import { STUDENT_ERROR_MESSAGE, STUDENT_SUCCESS_MESSAGE } from "../../utils/constants";

export class StudentLmsEnrollmentController implements IStudentLmsEnrollmentController {
  constructor(private readonly service: IStudentLmsEnrollmentService) {}

  async getEnrolledLearningPaths(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ error:  STUDENT_ERROR_MESSAGE.STUDENT_UNAUTHORIZED});
        return;
      }

      const learningPaths = await this.service.getEnrolledLearningPaths(userId);
      res.status(StatusCode.OK).json({ data: learningPaths });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: (error as Error).message });
    }
  }

  async getLearningPathDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { learningPathId } = req.params;
      if (!userId || !learningPathId) {
        res.status(StatusCode.BAD_REQUEST).json({ error: STUDENT_ERROR_MESSAGE.USERID_LEARNINGPATHID_REQUIRED });
        return;
      }

      const details = await this.service.getLearningPathDetails(userId, learningPathId);
      res.status(StatusCode.OK).json({ data: details });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: (error as Error).message });
    }
  }

  async completeCourseAndUnlockNext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { learningPathId, courseId } = req.body;
      if (!userId || !learningPathId || !courseId) {
        res.status(StatusCode.BAD_REQUEST).json({ error: STUDENT_ERROR_MESSAGE.USER_LEARNINGPATH_COURSE_IDS_REQUIRED });
        return;
      }

      const enrollment = await this.service.completeCourseAndUnlockNext(userId, learningPathId, courseId);
      res.status(StatusCode.OK).json({ data: enrollment, message: STUDENT_SUCCESS_MESSAGE.COURSE_COMPLETED_NEXT_COURSE_UNLOCKED });
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(error);
      
      
      if (errorMessage.includes(STUDENT_ERROR_MESSAGE.ALL_CHAPTERS_QUIZES_NEED_TO_COMPLETED)) {
        res.status(StatusCode.BAD_REQUEST).json({ 
          message: STUDENT_ERROR_MESSAGE.COMPLETE_ENTIRE_COURSE_CHAPTERS_AND_QUIZES
        });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
          error: STUDENT_ERROR_MESSAGE.TRY_AGAIN,
          message: errorMessage 
        });
      }
    }
  }

  async getLearningPathCertificate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { learningPathId } = req.params;
      if (!userId || !learningPathId) {
        res.status(StatusCode.BAD_REQUEST).json({ error: STUDENT_ERROR_MESSAGE.USERID_LEARNINGPATHID_REQUIRED });
        return;
      }

      const details = await this.service.getLearningPathDetails(userId, learningPathId);
      if (!details.enrollment.certificateGenerated || !details.enrollment.certificateUrl) {
        res.status(StatusCode.NOT_FOUND).json({ error: STUDENT_ERROR_MESSAGE.CERTIFICATE_NOT_AVAILABLE });
        return;
      }

      const presignedCertificateUrl = await getPresignedUrl(details.enrollment.certificateUrl);
      res.status(StatusCode.OK).json({ data: { certificateUrl: presignedCertificateUrl } });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: (error as Error).message });
    }
  }
}