import { IStudentCourseReviewController } from './interfaces/IStudentCourseReviewController'; 
import { Response } from 'express';
import { IStudentCourseReviewService } from '../../services/studentServices/interface/IStudentCourseReviewService'; 
import { AuthenticatedRequest } from '../../middlewares/authenticatedRoutes';
import { StatusCode } from '../../utils/enums';
import { ReviewMessages } from '../../utils/constants';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export class StudentCourseReviewController implements IStudentCourseReviewController {
  private readonly _studentCourseReviewService: IStudentCourseReviewService;

  constructor(studentCourseReviewService: IStudentCourseReviewService) {
    this._studentCourseReviewService = studentCourseReviewService;
  }

  async createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: ReviewMessages.UNAUTHORIZED });
        return;
      }
      const { courseId, rating, reviewText,completionPercentage } = req.body;
      const review = await this._studentCourseReviewService.createReview(studentId, { courseId, rating, reviewText },{completionPercentage});
      res.status(StatusCode.CREATED).json(review);
    } catch (err) {
      res.status(StatusCode.BAD_REQUEST).json({ error: getErrorMessage(err) || ReviewMessages.BAD_REQUEST });
    }
  }

  async updateReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: ReviewMessages.UNAUTHORIZED });
        return;
      }
      const reviewId = req.params.id;
      const updates = req.body;
      const updatedReview = await this._studentCourseReviewService.updateReview(studentId, reviewId, updates);
      if (!updatedReview) {
        res.status(StatusCode.NOT_FOUND).json({ error: ReviewMessages.REVIEW_NOT_FOUND });
        return;
      }
      res.json(updatedReview);
    } catch (err) {
      res.status(StatusCode.BAD_REQUEST).json({ error: getErrorMessage(err) || ReviewMessages.BAD_REQUEST });
    }
  }

  async deleteReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: ReviewMessages.UNAUTHORIZED });
        return;
      }
      const reviewId = req.params.id;
      const deletedReview = await this._studentCourseReviewService.deleteReview(studentId, reviewId);
      if (!deletedReview) {
        res.status(StatusCode.NOT_FOUND).json({ error: ReviewMessages.REVIEW_NOT_FOUND });
        return;
      }
      res.json({ message: ReviewMessages.REVIEW_DELETED });
    } catch (err) {
      res.status(StatusCode.BAD_REQUEST).json({ error: getErrorMessage(err) || ReviewMessages.BAD_REQUEST });
    }
  }

  async getMyReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: ReviewMessages.UNAUTHORIZED });
        return;
      }
      const reviews = await this._studentCourseReviewService.getMyReviews(studentId);
      res.json(reviews);
    } catch (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: getErrorMessage(err) || ReviewMessages.INTERNAL_ERROR });
    }
  }

  async getMyReviewForCourse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: ReviewMessages.UNAUTHORIZED });
        return;
      }
      const courseId = req.params.courseId;
      const review = await this._studentCourseReviewService.getMyReviewForCourse(studentId, courseId);
      res.json(review ?? {});
    } catch (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: getErrorMessage(err) || ReviewMessages.INTERNAL_ERROR });
    }
  }
}
