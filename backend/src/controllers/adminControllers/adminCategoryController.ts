import { Request, Response } from "express";
import { IAdminCategoryController } from "../adminControllers/interface/IAdminCategoryController";
import { IAdminCategoryService } from "../../services/adminServices/interface/IAdminCategoryService";
import {
  AdminErrorMessages,
  AdminSuccessMessages,
  CategoryErrorMsg,
  CategorySuccessMsg,
  GeneralServerErrorMsg,
} from "../../utils/constants";
import { StatusCode } from "../../utils/enums";
import { ICategoryModel } from "../../models/categoryModel";
import { appLogger } from "../../utils/logger";

export class AdminCategoryController implements IAdminCategoryController {
  private _categoryService: IAdminCategoryService;

  constructor(categoryService: IAdminCategoryService) {
    this._categoryService = categoryService;
  }

  async addCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryName } = req.body;
      const existingCategory = await this._categoryService.findCategoryByName(categoryName);
      if (existingCategory) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: CategoryErrorMsg.CATEGORY_EXISTS,
        });
        return;
      }

      const createdCategory = await this._categoryService.addCategory(categoryName);
      if (createdCategory) {
        res.status(StatusCode.CREATED).json({
          success: true,
          message: CategorySuccessMsg.CATEGORY_ADDED,
          data: createdCategory,
        });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CategoryErrorMsg.CATEGORY_NOT_CREATED,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : CategoryErrorMsg.CATEGORY_NOT_CREATED;
      appLogger.error("Add Category Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  async editCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryName, id } = req.body;

      const existingCategory = await this._categoryService.findCategoryByName(categoryName) as ICategoryModel | null;

      if (existingCategory && existingCategory._id.toString() !== id) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: CategoryErrorMsg.CATEGORY_EXISTS,
        });
        return;
      }

      const updatedCategory = await this._categoryService.updateCategory(id, categoryName);

      if (updatedCategory) {
        res.status(StatusCode.OK).json({
          success: true,
          message: CategorySuccessMsg.CATEGORY_UPDATED,
          data: updatedCategory,
        });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: CategoryErrorMsg.CATEGORY_NOT_UPDATED,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : CategoryErrorMsg.CATEGORY_NOT_UPDATED;
      appLogger.error("Edit Category Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  async getAllCategory(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const { data, total } = await this._categoryService.getAllCategoriesPaginated(page, limit, search);

      res.status(StatusCode.OK).json({
        success: true,
        message: AdminSuccessMessages.ADMIN_CATEGROY_FETCHED,
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : AdminErrorMessages.ADMIN_CATEGORY_FETCHEDERROR;
      appLogger.error("Get All Categories Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  async listOrUnlistCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const response = await this._categoryService.listOrUnlistCategory(id);

      if (!response) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: GeneralServerErrorMsg.INTERNAL_SERVER_ERROR,
        });
        return;
      }

      const message = response.isListed
        ? CategorySuccessMsg.CATEGORY_LISTED
        : CategorySuccessMsg.CATEGORY_UNLISTED;
      res.status(StatusCode.OK).json({
        success: true,
        message,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : GeneralServerErrorMsg.INTERNAL_SERVER_ERROR;
      appLogger.error("List/Unlist Category Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  async findCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const response = await this._categoryService.findCategoryById(categoryId);

      if (!response) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: CategoryErrorMsg.CATEGORY_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: CategorySuccessMsg.CATEGORY_FETCHED,
        data: response,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : CategoryErrorMsg.CATEGORY_NOT_FOUND;
      appLogger.error("Find Category By ID Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      });
    }
  }
}