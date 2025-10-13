import { Request, Response, NextFunction } from "express";
import { IAdminLearningPathController } from "./interface/IAdminLearningPathController";
import { IAdminLearningPathService } from "../../services/adminServices/interface/IAdminLearningPathService";
import { StatusCode } from "../../utils/enums";
import { LearningPathSuccessMessages, LearningPathErrorMessages } from "../../utils/constants";
import { Types } from "mongoose";

export class AdminLearningPathController implements IAdminLearningPathController {
  private _learningPathService: IAdminLearningPathService;

  constructor(learningPathService: IAdminLearningPathService) {
    this._learningPathService = learningPathService;
  }

  async getSubmittedLearningPaths(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "";

      const result = await this._learningPathService.getSubmittedLearningPaths(page, limit, search, status);

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLearningPathById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;

      // Validate learningPathId
      if (!learningPathId || learningPathId === "undefined" || !Types.ObjectId.isValid(learningPathId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: LearningPathErrorMessages.INVALID_ID,
        });
        return;
      }

      const dto = await this._learningPathService.getLearningPathById(learningPathId);
      if (!dto) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: dto });
    } catch (error) {
      next(error);
    }
  }

  async verifyLearningPath(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const { status, adminReview } = req.body;

      // Validate learningPathId
      if (!learningPathId || learningPathId === "undefined" || !Types.ObjectId.isValid(learningPathId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: LearningPathErrorMessages.INVALID_ID,
        });
        return;
      }

      if (!status || !["accepted", "rejected"].includes(status)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: LearningPathErrorMessages.INVALID_STATUS,
        });
        return;
      }

      if (!adminReview || typeof adminReview !== "string" || adminReview.trim() === "") {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: LearningPathErrorMessages.MISSING_FIELDS,
        });
        return;
      }

      const updated = await this._learningPathService.verifyLearningPath(learningPathId, status, adminReview.trim());

      if (!updated) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: status === "accepted" ? LearningPathSuccessMessages.APPROVED : LearningPathSuccessMessages.REJECTED,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}