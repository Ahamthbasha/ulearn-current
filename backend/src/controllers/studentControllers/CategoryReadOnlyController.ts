import { ICategoryReadOnlyController } from "./interfaces/ICategoryReadOnlyController";
import { ICategoryReadOnlyService } from "../../services/interface/ICategoryReadOnlyService";
import { Request, Response } from "express";

export class CategoryReadOnlyController implements ICategoryReadOnlyController {
  private categoryService: ICategoryReadOnlyService;

  constructor(categoryService: ICategoryReadOnlyService) {
    this.categoryService = categoryService;
  }

  async getAllCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.categoryService.getAllCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
  }
}
