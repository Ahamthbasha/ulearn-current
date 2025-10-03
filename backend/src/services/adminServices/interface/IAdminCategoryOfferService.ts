import { ICategoryModel } from "../../../models/categoryModel";
import { ICategoryOffer } from "../../../models/categoryOfferModel";

export interface IAdminCategoryOfferService {
  getListedCategories(): Promise<ICategoryModel[]>;
  createCategoryOffer(
    categoryId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ICategoryOffer>;
  editCategoryOffer(
    categoryOfferId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ICategoryOffer>;
  toggleCategoryOfferActive(categoryOfferId: string): Promise<ICategoryOffer>;
  deleteCategoryOffer(categoryOfferId: string): Promise<void>;
  getCategoryOffers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ICategoryOffer[]; total: number }>;
  getCategoryOfferById(categoryOfferId: string): Promise<ICategoryOffer | null>;
}