import { Request, Response, NextFunction } from "express";
import { IInstructorLearningPathController } from "./interfaces/IInstructorLearningPathController";
import { IInstructorLearningPathService } from "../../services/instructorServices/interface/IInstructorLearningPathService";
import { ILearningPath, CreateLearningPathDTO } from "../../models/learningPathModel";
import getId from "../../utils/getId";
import { StatusCode } from "../../utils/enums";
import { INSTRUCTOR_ERROR_MESSAGE, LearningPathSuccessMessages, LearningPathErrorMessages } from "../../utils/constants";
import { Types } from "mongoose";

export class InstructorLearningPathController implements IInstructorLearningPathController {
  private _learningPathService: IInstructorLearningPathService;

  constructor(learningPathService: IInstructorLearningPathService) {
    this._learningPathService = learningPathService;
  }

  async createLearningPath(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { title, description, items } = req.body;
      const instructorId = await getId(req);

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.UNAUTHORIZED_ID,
        });
        return;
      }

      if (!title || !description || !Array.isArray(items) || items.length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: LearningPathErrorMessages.MISSING_FIELDS,
        });
        return;
      }

      const trimmedTitle = title.trim().toLowerCase();
      const isAlreadyCreated = await this._learningPathService.isLearningPathAlreadyCreatedByInstructor(
        trimmedTitle,
        instructorId,
      );
      if (isAlreadyCreated) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: LearningPathErrorMessages.ALREADY_CREATED,
        });
        return;
      }

      const learningPathDTO: CreateLearningPathDTO = {
        title: trimmedTitle,
        description,
        instructorId: new Types.ObjectId(instructorId),
        items: items.map((item: any) => ({
          courseId: new Types.ObjectId(item.courseId),
          order: Number(item.order),
        })),
      };

      const created = await this._learningPathService.createLearningPath(learningPathDTO);

      res.status(StatusCode.CREATED).json({
        success: true,
        message: LearningPathSuccessMessages.CREATED,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLearningPath(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const { title, description, items } = req.body;
      const instructorId = await getId(req);

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
        });
        return;
      }

      const trimmedTitle = title?.trim().toLowerCase();
      if (trimmedTitle) {
        const isDuplicate = await this._learningPathService.isLearningPathAlreadyCreatedByInstructorExcluding(
          trimmedTitle,
          instructorId,
          learningPathId,
        );
        if (isDuplicate) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: LearningPathErrorMessages.ALREADY_CREATED,
          });
          return;
        }
      }

      const updateData: Partial<ILearningPath> = {};
      if (title) updateData.title = trimmedTitle;
      if (description) updateData.description = description;
      if (Array.isArray(items)) {
        updateData.items = items.map((item: any) => ({
          courseId: new Types.ObjectId(item.courseId),
          order: Number(item.order),
        }));
      }

      const updated = await this._learningPathService.updateLearningPath(learningPathId, updateData);

      if (!updated) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: LearningPathSuccessMessages.UPDATED,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLearningPath(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const deleted = await this._learningPathService.deleteLearningPath(learningPathId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        message: LearningPathSuccessMessages.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLearningPathById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
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

  async getInstructorLearningPaths(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const instructorId = await getId(req);
      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "";

      const result = await this._learningPathService.getInstructorLearningPathsPaginated(
        instructorId,
        page,
        limit,
        search,
        status,
      );

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

  async publishLearningPath(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;

      const updated = await this._learningPathService.publishLearningPath(learningPathId);

      if (!updated) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: LearningPathSuccessMessages.PUBLISHED,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitLearningPathToAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const instructorId = await getId(req);

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.UNAUTHORIZED_ID,
        });
        return;
      }

      const learningPath = await this._learningPathService.getLearningPathById(learningPathId);
      if (!learningPath) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }

      if (learningPath.instructorId.toString() !== instructorId) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
        });
        return;
      }

      const submitted = await this._learningPathService.submitLearningPathToAdmin(learningPathId);

      res.status(StatusCode.OK).json({
        success: true,
        message: LearningPathSuccessMessages.SUBMITTED,
        data: submitted,
      });
    } catch (error) {
      next(error);
    }
  }

  async resubmitLearningPathToAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const instructorId = await getId(req);

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.UNAUTHORIZED_ID,
        });
        return;
      }

      const learningPath = await this._learningPathService.getLearningPathById(learningPathId);
      if (!learningPath) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }

      if (learningPath.instructorId.toString() !== instructorId) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
        });
        return;
      }

      const resubmitted = await this._learningPathService.resubmitLearningPathToAdmin(learningPathId);

      res.status(StatusCode.OK).json({
        success: true,
        message: LearningPathSuccessMessages.RESUBMITTED, // New success message
        data: resubmitted,
      });
    } catch (error) {
      next(error);
    }
  }
}