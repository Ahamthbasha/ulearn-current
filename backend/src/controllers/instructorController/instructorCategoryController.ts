import { Request, Response, NextFunction } from "express";
import { IInstructorCategoryController } from "./interfaces/IInstructorCategoryController";
import { IInstructorCategoryService } from "../../services/interface/IInstructorCategoryService";
import { StatusCode } from "../../utils/enums";

export class InstructorCategoryController implements IInstructorCategoryController {
  constructor(private readonly categoryService: IInstructorCategoryService) {}

  async getListedCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await this.categoryService.fetchActiveCategories();
      res.status(StatusCode.OK).json({ success: true, data: categories });
    } catch (error) {
      console.error("Error in getListedCategories:", error);
      next(error);
    }
  }
}
