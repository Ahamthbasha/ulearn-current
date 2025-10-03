import { Request, Response } from "express";

export interface IAdminCategoryOfferController {
  getListedCategories(req: Request, res: Response): Promise<void>;
  createCategoryOffer(req: Request, res: Response): Promise<void>;
  editCategoryOffer(req: Request, res: Response): Promise<void>;
  toggleCategoryOfferActive(req: Request, res: Response): Promise<void>;
  deleteCategoryOffer(req: Request, res: Response): Promise<void>;
  getCategoryOffers(req: Request, res: Response): Promise<void>;
  getCategoryOfferById(req: Request, res: Response): Promise<void>;
}