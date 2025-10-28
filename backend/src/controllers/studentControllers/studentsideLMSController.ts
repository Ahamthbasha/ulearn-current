import { Response, NextFunction } from "express";
import { IStudentLearningPathController } from "./interfaces/IStudentsideLMSController";
import { IStudentLearningPathService } from "../../services/studentServices/interface/IStudentsideLMSService";
import { StatusCode } from "../../utils/enums";
import {
  LearningPathSuccessMessages,
  LearningPathErrorMessages,
} from "../../utils/constants";
import { Types } from "mongoose";
import { IMulterFile } from "../../utils/s3Bucket";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { appLogger } from "../../utils/logger";
import { CreateLearningPathDTO, ILearningPath } from "../../models/learningPathModel";

export class StudentLearningPathController
  implements IStudentLearningPathController
{
  private _learningPathService: IStudentLearningPathService;

  constructor(learningPathService: IStudentLearningPathService) {
    this._learningPathService = learningPathService;
  }

  async createLearningPath(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { title, description, items, category } = req.body;
      const thumbnail = req.file as IMulterFile | undefined;
      const studentId = req.user?.id;

      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: Student ID not found",
        });
        return;
      }

      // Validate inputs
      if (
        !title ||
        typeof title !== "string" ||
        title.trim().length < 3 ||
        title.trim().length > 100
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Title must be a string between 3 and 100 characters",
        });
        return;
      }
      if (
        !description ||
        typeof description !== "string" ||
        description.trim().length < 10 ||
        description.trim().length > 1000
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message:
            "Description must be a string between 10 and 1000 characters",
        });
        return;
      }
      if (!category || !Types.ObjectId.isValid(category)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid category ID",
        });
        return;
      }

      let parsedItems;
      try {
        parsedItems = typeof items === "string" ? JSON.parse(items) : items;
      } catch (error) {
        appLogger.error("create learning path error", error);
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid items format",
        });
        return;
      }

      if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Items must be a non-empty array",
        });
        return;
      }

      for (const item of parsedItems) {
        if (
          !Types.ObjectId.isValid(item.courseId) ||
          typeof item.order !== "number" ||
          item.order < 1
        ) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message:
              "Each item must have a valid courseId and a positive order number",
          });
          return;
        }
      }

      if (!thumbnail) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Thumbnail is required",
        });
        return;
      }

      if (
        !["image/jpeg", "image/png", "image/gif"].includes(thumbnail.mimetype)
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Thumbnail must be an image (JPEG, PNG, or GIF)",
        });
        return;
      }

      const trimmedTitle = title.trim().toLowerCase();
      const sanitizedDescription = description;
      const isAlreadyCreated =
        await this._learningPathService.isLearningPathAlreadyCreatedByStudent(
          trimmedTitle,
          studentId,
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
        description: sanitizedDescription,
        studentId: new Types.ObjectId(studentId),
        items: parsedItems.map((item: any) => ({
          courseId: new Types.ObjectId(item.courseId),
          order: Number(item.order),
        })),
        thumbnailUrl: "",
        category: new Types.ObjectId(category),
      };

      const created = await this._learningPathService.createLearningPath(
        learningPathDTO,
        thumbnail,
      );

      res.status(StatusCode.CREATED).json({
        success: true,
        message: LearningPathSuccessMessages.CREATED,
        data: created,
      });
    } catch (error) {
      appLogger.error("Error in createLearningPath:", error);
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
      const studentId = req.user?.id;

      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: Student ID not found",
        });
        return;
      }

      const learningPath =
        await this._learningPathService.getLearningPathById(learningPathId);
      if (!learningPath) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }

      if (learningPath.studentId.toString() !== studentId) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: "Unauthorized: You do not own this learning path",
        });
        return;
      }

      const updateData: Partial<ILearningPath> = {};
      if (title) {
        if (
          typeof title !== "string" ||
          title.trim().length < 3 ||
          title.trim().length > 100
        ) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: "Title must be a string between 3 and 100 characters",
          });
          return;
        }
        const trimmedTitle = title.trim().toLowerCase();
        const isDuplicate =
          await this._learningPathService.isLearningPathAlreadyCreatedByStudentExcluding(
            trimmedTitle,
            studentId,
            learningPathId,
          );
        if (isDuplicate) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: LearningPathErrorMessages.ALREADY_CREATED,
          });
          return;
        }
        updateData.title = trimmedTitle;
      }

      if (description) {
        if (
          typeof description !== "string" ||
          description.trim().length < 10 ||
          description.trim().length > 1000
        ) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message:
              "Description must be a string between 10 and 1000 characters",
          });
          return;
        }
        updateData.description = description;
      }

      if (category) {
        if (!Types.ObjectId.isValid(category)) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: "Invalid category ID",
          });
          return;
        }
        updateData.category = new Types.ObjectId(category);
      }

      if (items) {
        let parsedItems;
        try {
          parsedItems = typeof items === "string" ? JSON.parse(items) : items;
        } catch (error) {
          appLogger.error("update learning path error", error);
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: "Invalid items format",
          });
          return;
        }

        if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: "Items must be a non-empty array",
          });
          return;
        }

        for (const item of parsedItems) {
          if (
            !Types.ObjectId.isValid(item.courseId) ||
            typeof item.order !== "number" ||
            item.order < 1
          ) {
            res.status(StatusCode.BAD_REQUEST).json({
              success: false,
              message:
                "Each item must have a valid courseId and a positive order number",
            });
            return;
          }
        }

        updateData.items = parsedItems.map((item: any) => ({
          courseId: new Types.ObjectId(item.courseId),
          order: Number(item.order),
        }));
      }

      if (thumbnail) {
        if (
          !["image/jpeg", "image/png", "image/gif"].includes(thumbnail.mimetype)
        ) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: "Thumbnail must be an image (JPEG, PNG, or GIF)",
          });
          return;
        }
      }

      const updated = await this._learningPathService.updateLearningPath(
        learningPathId,
        updateData,
        thumbnail,
      );

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
      const studentId = req.user?.id;

      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: Student ID not found",
        });
        return;
      }

      const learningPath =
        await this._learningPathService.getLearningPathById(learningPathId);
      if (!learningPath) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: LearningPathErrorMessages.NOT_FOUND,
        });
        return;
      }

      if (learningPath.studentId.toString() !== studentId) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: "Unauthorized: You do not own this learning path",
        });
        return;
      }

      const deleted =
        await this._learningPathService.deleteLearningPath(learningPathId);
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
      const dto =
        await this._learningPathService.getLearningPathById(learningPathId);
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

  async getStudentLearningPaths(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const studentId = req.user?.id;
      console.log(studentId)
      if (!studentId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: Student ID not found",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const result =
        await this._learningPathService.getStudentLearningPathsPaginated(
          studentId,
          page,
          limit,
          search,
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
}