import {
  ICourseOfferListDTO,
  ICourseOfferDetailDTO,
} from "../../../dto/adminDTO/adminCourseOfferDTO";

export interface IAdminCourseOfferService {
  getOfferRequests(
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: ICourseOfferListDTO[]; total: number }>;
  verifyCourseOffer(
    offerId: string,
    status: "approved" | "rejected",
    reviews?: string,
  ): Promise<ICourseOfferDetailDTO>;
  getOfferById(offerId: string): Promise<ICourseOfferDetailDTO | null>;
}
