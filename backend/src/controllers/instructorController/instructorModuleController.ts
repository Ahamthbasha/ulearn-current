import { Request, Response, NextFunction } from "express";
import { IInstructorModuleController } from "./interfaces/IInstructorModuleController";
import { IInstructorModuleService } from "../../services/instructorServices/interface/IInstructorModuleService";
import { StatusCode } from "../../utils/enums";
import { ModuleErrorMessages, ModuleSuccessMessages } from "src/utils/constants";

export class InstructorModuleController implements IInstructorModuleController {
  private _moduleService: IInstructorModuleService;
  
  constructor(moduleService: IInstructorModuleService) {
    this._moduleService = moduleService;
  }

  async createModule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleTitle, moduleNumber, description, courseId } = req.body;

      const existing =
        await this._moduleService.findByTitleOrNumberAndCourseId(
          courseId,
          moduleTitle,
          Number(moduleNumber)
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
        moduleNumber: Number(moduleNumber),
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
      const { moduleTitle, moduleNumber, description } = req.body as {
        moduleTitle?: string;
        moduleNumber?: string;
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

      if (moduleTitle || moduleNumber) {
        const titleToCheck = moduleTitle?.trim();
        const numberToCheck = moduleNumber ? Number(moduleNumber) : undefined;

        if (titleToCheck || (numberToCheck !== undefined && !isNaN(numberToCheck))) {
          const existing = await this._moduleService.findByTitleOrNumberAndCourseId(
            courseId,
            titleToCheck ?? "",
            numberToCheck ?? 0,
            moduleId
          );

          if (existing) {
            const isTitleConflict =
              titleToCheck &&
              existing.moduleTitle.toLowerCase() === titleToCheck.toLowerCase();
            const isNumberConflict =
              numberToCheck !== undefined &&
              existing.moduleNumber === numberToCheck;

            let errorMessage = "";
            if (isTitleConflict && isNumberConflict) {
              errorMessage = "Module title and number already exist";
            } else if (isTitleConflict) {
              errorMessage = ModuleErrorMessages.MODULE_ALREADY_EXIST;
            } else if (isNumberConflict) {
              errorMessage = ModuleErrorMessages.MODULE_NUMBER_ALREADY_EXIST;
            }

            if (errorMessage) {
              res.status(StatusCode.CONFLICT).json({
                success: false,
                message: errorMessage,
              });
              return;
            }
          }
        }
      }

      const updatedModuleData: Partial<{
        moduleTitle: string;
        moduleNumber: number;
        description: string;
      }> = {};

      if (moduleTitle !== undefined) updatedModuleData.moduleTitle = moduleTitle.trim();
      if (moduleNumber !== undefined) {
        const num = Number(moduleNumber);
        if (!isNaN(num)) updatedModuleData.moduleNumber = num;
      }
      if (description !== undefined) updatedModuleData.description = description;

      if (Object.keys(updatedModuleData).length === 0) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "No valid fields provided to update",
        });
        return;
      }

      const updated = await this._moduleService.updateModule(
        moduleId,
        updatedModuleData
      );

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

  async deleteModule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = req.params;
      const deleted = await this._moduleService.deleteModule(moduleId);
      
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ModuleErrorMessages.MODULE_NOT_FOUND,
        });
        return;
      }
      
      res.status(StatusCode.OK).json({
        success: true,
        message: ModuleSuccessMessages.MODULE_DELETED,
      });
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
}