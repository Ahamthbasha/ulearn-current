import { Request, Response } from "express";

export interface ICategoryReadOnlyController {
  getAllCategories(req: Request, res: Response): Promise<void>;
}
