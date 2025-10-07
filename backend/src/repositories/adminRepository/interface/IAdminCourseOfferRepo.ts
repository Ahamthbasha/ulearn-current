import { PopulatedCourseOffer } from "../../../dto/adminDTO/adminCourseOfferDTO";
import { ICourseOffer } from "../../../models/courseOfferModel";
import { IGenericRepository } from "../../../repositories/genericRepository";

export interface IAdminCourseOfferRepo extends IGenericRepository<ICourseOffer> {
  findByIdPopulated(offerId: string): Promise<PopulatedCourseOffer | null>;
  updateByIdPopulated(offerId: string, data: Partial<ICourseOffer>): Promise<PopulatedCourseOffer | null>;
  getOfferRequests(page: number, limit: number, search?: string, status?: string): Promise<{ data: PopulatedCourseOffer[]; total: number }>;
}