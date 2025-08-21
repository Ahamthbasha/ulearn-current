import { ICategoryReadOnlyController } from "./interfaces/ICategoryReadOnlyController";
import { ICategoryReadOnlyService } from "../../services/interface/ICategoryReadOnlyService";
import { Request, Response } from "express";
import { StatusCode } from "../../utils/enums";
import { CategoryErrorMsg } from "../../utils/constants";

export class CategoryReadOnlyController implements ICategoryReadOnlyController {
  private _categoryService: ICategoryReadOnlyService;

  constructor(categoryService: ICategoryReadOnlyService) {
    this._categoryService = categoryService;
  }

  async getAllCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await this._categoryService.getAllCategories();
      res.status(StatusCode.OK).json({ success: true, data: categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: CategoryErrorMsg.CATEGORY_FAILED_TO_FETCH,
      });
    }
  }
}
