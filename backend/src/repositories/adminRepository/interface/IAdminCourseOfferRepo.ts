import { ICourseOffer } from "../../../models/courseOfferModel";
import { IGenericRepository } from "../../../repositories/genericRepository";

export interface IAdminCourseOfferRepo extends IGenericRepository<ICourseOffer> {
  findById(offerId: string): Promise<ICourseOffer | null>;
  updateById(offerId: string, data: Partial<ICourseOffer>): Promise<ICourseOffer | null>;
  getOfferRequests(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ data: ICourseOffer[]; total: number }>;
}
