
import { ICourseOffer } from "../../models/courseOfferModel";
import { IAdminCourseOfferRepo } from "../../repositories/adminRepository/interface/IAdminCourseOfferRepo";
import { IAdminCourseOfferService } from "./interface/IAdminCourseOfferService";
import { ICourseOfferListDTO, ICourseOfferDetailDTO,} from "../../dto/adminDTO/adminCourseOfferDTO";
import { mapToCourseOfferListDTO, mapToCourseOfferDetailDTO } from "../../mappers/adminMapper/adminCourseOfferMapper";

export class AdminCourseOfferService implements IAdminCourseOfferService {
  private _adminCourseOfferRepo: IAdminCourseOfferRepo;

  constructor(adminCourseOfferRepo: IAdminCourseOfferRepo) {
    this._adminCourseOfferRepo = adminCourseOfferRepo;
  }

  async getOfferRequests(page: number, limit: number, search?: string, status?: string): Promise<{ data: ICourseOfferListDTO[]; total: number }> {
    const result = await this._adminCourseOfferRepo.getOfferRequests(page, limit, search, status);
    return {
      data: result.data.map(mapToCourseOfferListDTO),
      total: result.total,
    };
  }

  async verifyCourseOffer(offerId: string, status: "approved" | "rejected", reviews?: string): Promise<ICourseOfferDetailDTO> {
    const offer = await this._adminCourseOfferRepo.findByIdPopulated(offerId);
    if (!offer) throw new Error("Course offer request not found.");

    const updateData: Partial<ICourseOffer> = {
      status,
      isVerified: status === "approved",
      isActive: status === "approved",
      reviews: reviews || "",
    };

    const updatedOffer = await this._adminCourseOfferRepo.updateByIdPopulated(offerId, updateData);
    if (!updatedOffer) {
      throw new Error("Admin course offer verification error");
    }

    return mapToCourseOfferDetailDTO(updatedOffer);
  }

  async getOfferById(offerId: string): Promise<ICourseOfferDetailDTO | null> {
    const offer = await this._adminCourseOfferRepo.findByIdPopulated(offerId);
    return offer ? mapToCourseOfferDetailDTO(offer) : null;
  }
}
