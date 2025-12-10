import { Request, Response, NextFunction } from "express";
import { IInstructorModuleController } from "./interfaces/IInstructorModuleController";
import { IInstructorModuleService } from "../../services/instructorServices/interface/IInstructorModuleService";
import { StatusCode } from "../../utils/enums";
import { InstructorModuleMessages, ModuleErrorMessages, ModuleSuccessMessages } from "../../utils/constants";
import { IModule } from "../../models/moduleModel";
import { IInstructorCourseService } from "../../services/instructorServices/interface/IInstructorCourseService";

export class InstructorModuleController implements IInstructorModuleController {
  private _moduleService: IInstructorModuleService;
  private _courseService: IInstructorCourseService;
  
  constructor(moduleService: IInstructorModuleService,courseService:IInstructorCourseService) {
    this._moduleService = moduleService;
    this._courseService = courseService;
  }

  async createModule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleTitle, description, courseId } = req.body;

      const existing =
        await this._moduleService.findByTitleAndCourseId(
          courseId,
          moduleTitle,
        );
      
      if (existing) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message:
            existing.moduleTitle.toLowerCase() === moduleTitle.toLowerCase()
              ? ModuleErrorMessages.MODULE_ALREADY_EXIST
              : ModuleErrorMessages.MODULE_NUMBER_ALREADY_EXIST,
        });
        return;
      }

      const moduleDTO = {
        moduleTitle,
        courseId,
        description,
      };

      const module = await this._moduleService.createModule(moduleDTO);
      
      res.status(StatusCode.CREATED).json({
        success: true,
        message: ModuleSuccessMessages.MODULE_CREATED,
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async getModulesByCourse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = req.params;
      const { page = "1", limit = "10", search = "" } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const filter: Record<string, unknown> = {
        courseId,
      };

      if (search) {
        const searchNum = Number(search);
        filter.$or = [
          { moduleTitle: { $regex: search as string, $options: "i" } },
          { moduleNumber: isNaN(searchNum) ? -1 : searchNum },
        ];
      }

      const result = await this._moduleService.paginateModules(
        filter,
        pageNum,
        limitNum
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
        message: ModuleSuccessMessages.MODULE_RETRIEVED,
      });
    } catch (error) {
      next(error);
    }
  }

async updateModule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { moduleId } = req.params;
    const { moduleTitle, description } = req.body as {
      moduleTitle?: string;
      description?: string;
    };

    const originalModule = await this._moduleService.getModuleById(moduleId);
    if (!originalModule) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: ModuleErrorMessages.MODULE_NOT_FOUND,
      });
      return;
    }

    const courseId = originalModule.courseId.toString();

    if (moduleTitle?.trim()) {
      const existing = await this._moduleService.findByTitleAndCourseId(
        courseId,
        moduleTitle.trim(),
        moduleId
      );

      if (existing) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: ModuleErrorMessages.MODULE_ALREADY_EXIST,
        });
        return;
      }
    }

    const updatedModuleData: Partial<IModule> = {};

    if (moduleTitle !== undefined) updatedModuleData.moduleTitle = moduleTitle.trim();
    if (description !== undefined) updatedModuleData.description = description;

    if (Object.keys(updatedModuleData).length === 0) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: InstructorModuleMessages.NO_VALID_FIELDS_PROVIDED,
      });
      return;
    }

    const updated = await this._moduleService.updateModule(moduleId, updatedModuleData);
    if (!updated) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: ModuleErrorMessages.MODULE_NOT_FOUND,
      });
      return;
    }

    res.status(StatusCode.OK).json({
      success: true,
      data: updated,
      message: ModuleSuccessMessages.MODULE_UPDATED,
    });
  } catch (error) {
    next(error);
  }
}

  async deleteModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { moduleId } = req.params;

      const module = await this._moduleService.getModuleById(moduleId);
      if (!module) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: ModuleErrorMessages.MODULE_NOT_FOUND });
        return;
      }

      const deleted = await this._moduleService.deleteModule(moduleId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: ModuleErrorMessages.MODULE_NOT_FOUND });
        return;
      }

      await this._courseService.updateCourseDuration(module.courseId.toString());

      res.status(StatusCode.OK).json({ success: true, message: ModuleSuccessMessages.MODULE_DELETED });
    } catch (error) {
      next(error);
    }
  }

  async getModuleById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = req.params;
      const module = await this._moduleService.getModuleById(moduleId);

      if (!module) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ModuleErrorMessages.MODULE_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: module,
      });
    } catch (error) {
      next(error);
    }
  }

  async reorderModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const { orderedIds } = req.body as { orderedIds: string[] };

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: ModuleErrorMessages.INVALID_ORDEREDIDS,
      });
      return;
    }

    await this._moduleService.reorderModules(courseId, orderedIds);

    const updatedModules = await this._moduleService.getModulesByCourse(courseId)

    res.status(StatusCode.OK).json({
      success: true,
      message: ModuleSuccessMessages.MODULE_REORDERED,
      data:updatedModules
    });
  } catch (error) {
    next(error);
  }
}
}