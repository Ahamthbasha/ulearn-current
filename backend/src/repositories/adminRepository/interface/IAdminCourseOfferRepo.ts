import { ICourseOffer } from "../../../models/courseOfferModel";
import { IGenericRepository } from "../../../repositories/genericRepository";

export interface IAdminCourseOfferRepo extends IGenericRepository<ICourseOffer> {
  findById(offerId: string): Promise<ICourseOffer | null>;
  updateById(offerId: string, data: Partial<ICourseOffer>): Promise<ICourseOffer | null>;
  toggleActiveById(offerId: string): Promise<ICourseOffer | null>;
  deleteById(offerId: string): Promise<ICourseOffer | null>;
  getCourseOffers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ICourseOffer[]; total: number }>;
  getCourseOfferById(offerId:string):Promise<ICourseOffer | null>
}