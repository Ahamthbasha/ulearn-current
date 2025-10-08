import { Response, NextFunction } from "express";
import { IInstructorLearningPathController } from "./interfaces/IInstructorLearningPathController";
import { IInstructorLearningPathService } from "../../services/instructorServices/interface/IInstructorLearningPathService";
import { ILearningPath, CreateLearningPathDTO } from "../../models/learningPathModel";
import { StatusCode } from "../../utils/enums";
import { INSTRUCTOR_ERROR_MESSAGE, LearningPathSuccessMessages, LearningPathErrorMessages } from "../../utils/constants";
import { Types } from "mongoose";
import { IMulterFile } from "../../utils/s3Bucket";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";

export class InstructorLearningPathController implements IInstructorLearningPathController {
  private _learningPathService: IInstructorLearningPathService;

  constructor(learningPathService: IInstructorLearningPathService) {
    this._learningPathService = learningPathService;
  }

  async createLearningPath(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      console.log("req body",req.body)
      const { title, description, items, category } = req.body;
      const thumbnail = req.file as IMulterFile | undefined;
      const instructorId = req.user?.id;

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.UNAUTHORIZED_ID,
        });
        return;
      }

      let parsedItems;
      try {
        parsedItems = typeof items === "string" ? JSON.parse(items) : items;
      } catch (error) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid items format",
        });
        return;
      }

      if (!title || !description || !Array.isArray(parsedItems) || parsedItems.length === 0 || !thumbnail || !category) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: LearningPathErrorMessages.MISSING_FIELDS,
        });
        return;
      }

      if (!["image/jpeg", "image/png", "image/gif"].includes(thumbnail.mimetype)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Thumbnail must be an image (JPEG, PNG, or GIF)",
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
        items: parsedItems.map((item: any) => ({
          courseId: new Types.ObjectId(item.courseId),
          order: Number(item.order),
        })),
        thumbnailUrl: "",
        category: new Types.ObjectId(category), // Add category
      };

      const created = await this._learningPathService.createLearningPath(learningPathDTO, thumbnail);

      res.status(StatusCode.CREATED).json({
        success: true,
        message: LearningPathSuccessMessages.CREATED,
        data: created,
      });
    } catch (error) {
      console.error("Error in createLearningPath:", error);
      next(error);
    }
  }

  async updateLearningPath(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;

      const { title, description, items, category } = req.body;
      const thumbnail = req.file as IMulterFile | undefined;
      const instructorId = req.user?.id;

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
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

      let parsedItems;
      if (items) {
        try {
          parsedItems = typeof items === "string" ? JSON.parse(items) : items;
        } catch (error) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: "Invalid items format",
          });
          return;
        }
      }

      const updateData: Partial<ILearningPath> = {};
      if (trimmedTitle) updateData.title = trimmedTitle;
      if (description) updateData.description = description;
      if (Array.isArray(parsedItems)) {
        updateData.items = parsedItems.map((item: any) => ({
          courseId: new Types.ObjectId(item.courseId),
          order: Number(item.order),
        }));
      }
      if (category) updateData.category = new Types.ObjectId(category); // Add category

      if (learningPath.status === "accepted") {
        updateData.status = "pending";
        updateData.isPublished = false;
        updateData.adminReview = undefined;
      }

      const updated = await this._learningPathService.updateLearningPath(learningPathId, updateData, thumbnail);

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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const instructorId = req.user?.id;

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
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
    req: AuthenticatedRequest,
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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const instructorId = req.user?.id;

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const instructorId = req.user?.id;

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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { learningPathId } = req.params;
      const instructorId = req.user?.id;

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
        message: LearningPathSuccessMessages.RESUBMITTED,
        data: resubmitted,
      });
    } catch (error) {
      next(error);
    }
  }
}