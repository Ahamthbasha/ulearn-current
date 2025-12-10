import {  Response } from "express";
import { IInstructorCourseReviewService } from "../../services/instructorServices/interface/IInstructorCourseReviewService";
import { IInstructorCourseReviewController } from "./interfaces/IInstructorCourseReviewController"; 
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { InstructorReviewMessages } from "../../utils/constants";

export class InstructorCourseReviewController
  implements IInstructorCourseReviewController
{
    private _reviewService: IInstructorCourseReviewService
  constructor(reviewService: IInstructorCourseReviewService) {
    this._reviewService = reviewService
  }

async getReviews(req: AuthenticatedRequest, res: Response): Promise<void> {
  const instructorId = req.user?.id;
  if (!instructorId) {
    res.status(StatusCode.UNAUTHORIZED).json({
      success: false,
      message: InstructorReviewMessages.UNAUTHORIZED,
    });
    return;
  }

  const { courseId } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string, 10) || 10), 50);

  const statusFilter = req.query.status as "all" | "pending" | "approved" | "rejected" | "deleted" | undefined;
  const filter: { status?: typeof statusFilter } = {};
  if (statusFilter) filter.status = statusFilter;

  const search = req.query.search as string | undefined;

  try {
    const result = await this._reviewService.getCourseReviews(
      instructorId,
      courseId,
      page,
      limit,
      filter,
      search
    );

    res.status(StatusCode.OK).json({
      success: true,
      message: InstructorReviewMessages.FETCH_SUCCESS,
      data: result.data,
      pagination: {
        page: result.page ?? page,
        limit: result.limit ?? limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : InstructorReviewMessages.INTERNAL_ERROR;
    res.status(StatusCode.BAD_REQUEST).json({ success: false, message });
  }
}

  async flagReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    const instructorId = req.user?.id;

    if (!instructorId) {
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: InstructorReviewMessages.UNAUTHORIZED,
      });
      return;
    }

    const { reviewId } = req.params;

    try {
      const result = await this._reviewService.flagReview(instructorId, reviewId);

      const status = result.success ? StatusCode.OK : StatusCode.NOT_FOUND;
      const message = result.success
        ? InstructorReviewMessages.FLAG_SUCCESS
        : InstructorReviewMessages.FLAG_FAIL;

      res.status(status).json({
        success: result.success,
        message,
      });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: InstructorReviewMessages.INTERNAL_ERROR,
      });
    }
  }

  async getReviewStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const instructorId = req.user?.id;
  const { courseId } = req.params;

  if (!instructorId) {
    res.status(StatusCode.UNAUTHORIZED).json({ success: false, message: InstructorReviewMessages.UNAUTHORIZED });
    return;
  }

  try {
    const data = await this._reviewService.getCourseReviewStats(instructorId, courseId);
    res.status(StatusCode.OK).json({
      success: true,
      message: InstructorReviewMessages.COURSE_REVIEW_FETCHED,
      data,
    });
  } catch (error) {
    res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: error instanceof Error ? error.message : InstructorReviewMessages.FAILED_TO_FETCH_REVIEW_STATS,
    });
  }
}
}