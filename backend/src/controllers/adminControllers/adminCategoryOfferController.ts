import { Request, Response } from "express";
import { IAdminCategoryOfferService } from "../../services/adminServices/interface/IAdminCategoryOfferService";
import { IAdminCategoryOfferController } from "./interface/IAdminCategoryOfferController";
import { ICategoryModel } from "../../models/categoryModel";
import { ICategoryOffer } from "../../models/categoryOfferModel";
import { StatusCode } from "../../utils/enums";
import { CATEGORY_OFFER_MESSAGE } from "../../utils/constants";

export class AdminCategoryOfferController implements IAdminCategoryOfferController {
  private _categoryOfferService: IAdminCategoryOfferService;

  constructor(categoryOfferService: IAdminCategoryOfferService) {
    this._categoryOfferService = categoryOfferService;
  }

  async getListedCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories: ICategoryModel[] = await this._categoryOfferService.getListedCategories();
      res.status(StatusCode.OK).json({ success: true, data: categories });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async createCategoryOffer(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId, discountPercentage, startDate, endDate } = req.body;
      const offer: ICategoryOffer = await this._categoryOfferService.createCategoryOffer(
        categoryId,
        discountPercentage,
        new Date(startDate),
        new Date(endDate),
      );
      res.status(StatusCode.CREATED).json({ 
        success: true, 
        data: offer, 
        message: CATEGORY_OFFER_MESSAGE.CATEGORY_OFFER_CREATED 
      });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async editCategoryOffer(req: Request, res: Response): Promise<void> {
    try {
      const { categoryOfferId, discountPercentage, startDate, endDate } = req.body;
      const offer: ICategoryOffer = await this._categoryOfferService.editCategoryOffer(
        categoryOfferId,
        discountPercentage,
        new Date(startDate),
        new Date(endDate),
      );
      res.status(StatusCode.OK).json({ 
        success: true, 
        data: offer, 
        message: CATEGORY_OFFER_MESSAGE.CATEGORY_OFFER_EDITED 
      });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async toggleCategoryOfferActive(req: Request, res: Response): Promise<void> {
    try {
      const { categoryOfferId } = req.params;
      const offer: ICategoryOffer = await this._categoryOfferService.toggleCategoryOfferActive(categoryOfferId);
      res.status(StatusCode.OK).json({ success: true, data: offer });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async deleteCategoryOffer(req: Request, res: Response): Promise<void> {
    try {
      const { categoryOfferId } = req.params;
      await this._categoryOfferService.deleteCategoryOffer(categoryOfferId);
      res.status(StatusCode.OK).json({ 
        success: true, 
        message: CATEGORY_OFFER_MESSAGE.CATEGORY_OFFER_DELETED 
      });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async getCategoryOffers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const result = await this._categoryOfferService.getCategoryOffers(
        Number(page),
        Number(limit),
        search as string | undefined,
      );
      res.status(StatusCode.OK).json({ success: true, data: result.data, total: result.total });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async getCategoryOfferById(req: Request, res: Response): Promise<void> {
    try {
      const { categoryOfferId } = req.params;
      const offer = await this._categoryOfferService.getCategoryOfferById(categoryOfferId);
      res.status(StatusCode.OK).json({ success: true, data: offer });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }
}