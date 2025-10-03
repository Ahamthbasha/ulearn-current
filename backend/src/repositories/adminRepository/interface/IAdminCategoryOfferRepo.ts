import { IGenericRepository } from "../../genericRepository";
import { ICategoryOffer } from "../../../models/categoryOfferModel";

export interface IAdminCategoryOfferRepo extends IGenericRepository<ICategoryOffer> {
  findById(categoryOfferId: string): Promise<ICategoryOffer | null>;
  updateById(categoryOfferId: string, data: Partial<ICategoryOffer>): Promise<ICategoryOffer | null>;
  toggleActiveById(categoryOfferId: string): Promise<ICategoryOffer | null>;
  deleteById(categoryOfferId: string): Promise<ICategoryOffer | null>;
  getCategoryOffers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ICategoryOffer[]; total: number }>;
  getCategoryOfferById(categoryOfferId: string): Promise<ICategoryOffer | null>;
}