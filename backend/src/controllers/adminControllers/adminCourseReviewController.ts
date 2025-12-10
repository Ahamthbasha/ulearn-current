import { Request, Response } from "express";
import { IAdminCourseReviewService } from "../../services/adminServices/interface/IAdminCourseReviewService";
import { IAdminCourseReviewController } from "./interface/IAdminCourseReviewController";
import { StatusCode } from "../../utils/enums";
import { appLogger } from "../../utils/logger";
import { AdminReviewMessages } from "../../utils/constants";

export class AdminCourseReviewController implements IAdminCourseReviewController {
  private _adminCourseReviewService: IAdminCourseReviewService;

  constructor(adminCourseReviewService: IAdminCourseReviewService) {
    this._adminCourseReviewService = adminCourseReviewService;
  }

  async getAllReviews(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.query.courseId as string 
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined

      const result = await this._adminCourseReviewService.getAllReviews(courseId,page, limit, search, status);

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      appLogger.error("Error in getAllReviews:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminReviewMessages.FAILED_TO_FETCH_REVIEWS,
      });
    }
  }

  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminReviewMessages.REVIEW_ID_REQUIRED,
        });
        return;
      }

      const result = await this._adminCourseReviewService.deleteReview(reviewId);

      res.status(result.success ? StatusCode.OK : StatusCode.NOT_FOUND).json(result);
    } catch (error) {
      appLogger.error("Error in deleteReview:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminReviewMessages.FAILED_TO_DELETE_REVIEW,
      });
    }
  }

  async rejectReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;

      if (!reviewId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminReviewMessages.REVIEW_ID_REQUIRED,
        });
        return;
      }

      if (!reason?.trim()) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminReviewMessages.REJECTION_REASON_REQUIRED,
        });
        return;
      }

      const result = await this._adminCourseReviewService.rejectReview(reviewId, reason.trim());

      res.status(result.success ? StatusCode.OK : StatusCode.NOT_FOUND).json(result);
    } catch (error) {
      appLogger.error("Error in rejectReview:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminReviewMessages.FAILED_TO_REJECT_REVIEW,
      });
    }
  }

  async approveReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;

      if (!reviewId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminReviewMessages.REVIEW_ID_REQUIRED,
        });
        return;
      }

      const result = await this._adminCourseReviewService.approveReview(reviewId);

      res.status(result.success ? StatusCode.OK : StatusCode.NOT_FOUND).json(result);
    } catch (error) {
      appLogger.error("Error in approveReview:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminReviewMessages.FAILED_TO_APPROVE_REVIEW,
      });
    }
  }

  async getReviewById(req: Request, res: Response): Promise<void> {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: AdminReviewMessages.REVIEW_ID_REQUIRED,
      });
      return;
    }

    const review = await this._adminCourseReviewService.getReviewById(reviewId);

    if (!review) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: AdminReviewMessages.REVIEW_NOT_FOUND,
      });
      return;
    }

    res.status(StatusCode.OK).json({
      success: true,
      data: review,
    });
  } catch (error) {
    appLogger.error("Error in getReviewById:", error);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: AdminReviewMessages.FAILED_TO_FETCH_REVIEW,
    });
  }
}
}