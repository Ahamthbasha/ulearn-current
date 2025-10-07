import { ICourseOffer } from "../../../models/courseOfferModel";

export interface IAdminCourseOfferService {
  getOfferRequests(page: number, limit: number, search?: string): Promise<{ data: ICourseOffer[]; total: number }>;
  verifyCourseOffer(
    offerId: string,
    status: "approved" | "rejected",
    reviews?: string
  ): Promise<ICourseOffer>;
  getOfferById(offerId: string): Promise<ICourseOffer | null>;
}
