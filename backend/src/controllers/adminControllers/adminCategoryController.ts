import { Request, Response } from "express";
import { IAdminCategoryController } from "../adminControllers/interface/IAdminCategoryController";
import { IAdminCategoryService } from "../../services/interface/IAdminCategoryService";
import { CategoryErrorMsg, CategorySuccessMsg, GeneralServerErrorMsg } from "../../utils/constants";
import { StatusCode } from "../../utils/enums";
import { ICategoryModel } from "../../models/categoryModel";
export class AdminCategoryContoller implements IAdminCategoryController {
  private categoryService: IAdminCategoryService;
  constructor(categoryService: IAdminCategoryService) {
    this.categoryService = categoryService;
  }

  async addCategory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { categoryName } = req.body;
      const existingCategory = await this.categoryService.findCategoryByName(
        categoryName
      );
      if (existingCategory) {
        res
          .status(StatusCode.CONFLICT)
          .send({ success: false, message: CategoryErrorMsg.CATEGORY_EXISTS });
        return;
      }

      const createdCategory = await this.categoryService.addCategory(
        categoryName
      );
      if (createdCategory) {
        res
          .status(StatusCode.CREATED)
          .send({
            success: true,
            message: CategorySuccessMsg.CATEGORY_ADDED,
            data: createdCategory,
          });
      } else {
        res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .send({ success: false, message: CategoryErrorMsg.CATEGORY_NOT_CREATED });
      }
    } catch (error) {
      throw error
    }
  }



  async editCategory(req: Request, res: Response): Promise<void> {
  try {
    const { categoryName, id } = req.body;

    const existingCategory = await this.categoryService.findCategoryByName(categoryName) as ICategoryModel | null;

    if (existingCategory && existingCategory._id.toString() !== id) {
      res.status(StatusCode.CONFLICT).send({
        success: false,
        message: CategoryErrorMsg.CATEGORY_EXISTS,
      });
      return;
    }

    const updatedCategory = await this.categoryService.updateCategory(id, categoryName);

    if (updatedCategory) {
      res.status(StatusCode.OK).send({
        success: true,
        message: CategorySuccessMsg.CATEGORY_UPDATED,
        data: updatedCategory,
      });
    } else {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({
        success: false,
        message: CategoryErrorMsg.CATEGORY_NOT_UPDATED,
      });
    }
  } catch (error) {
    console.error("Edit Category Error:", error);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).send({
      success: false,
      message: CategoryErrorMsg.CATEGORY_NOT_UPDATED,
    });
  }
}


  async getAllCategory(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const { data, total } = await this.categoryService.getAllCategoriesPaginated(page, limit, search);

    res.status(StatusCode.OK).json({
      success: true,
      message: "Categories fetched successfully",
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong while fetching categories"
    });
  }
}


  async listOrUnlistCategory(
    req: Request,
    res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const response = await this.categoryService.listOrUnlistCategory(id);

      if (!response) throw new Error(GeneralServerErrorMsg.INTERNAL_SERVER_ERROR);

      const message = response.isListed
        ? CategorySuccessMsg.CATEGORY_LISTED
        : CategorySuccessMsg.CATEGORY_UNLISTED;
      res.status(StatusCode.OK).send({ success: true, message, data: response });
    } catch (error) {
      throw error
    }
  }

  async findCategoryById(
    req: Request,
    res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      const response = await this.categoryService.findCategoryById(categoryId);

      if (!response) throw new Error(GeneralServerErrorMsg.INTERNAL_SERVER_ERROR);

      res.status(StatusCode.OK).send({ success: true, message:CategorySuccessMsg.CATEGORY_FETCHED, data: response });
    } catch (error) {
      throw error
    }
  }
}