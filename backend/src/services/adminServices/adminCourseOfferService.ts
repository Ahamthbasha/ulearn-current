import { ICourseOffer } from "../../models/courseOfferModel";
import { IAdminCourseOfferRepo } from "../../repositories/adminRepository/interface/IAdminCourseOfferRepo";
import { IAdminCourseOfferService } from "./interface/IAdminCourseOfferService";

export class AdminCourseOfferService implements IAdminCourseOfferService {
  constructor(private repo: IAdminCourseOfferRepo) {}

  async getOfferRequests(page: number, limit: number, search?: string) : Promise<{ data: ICourseOffer[]; total: number }> {
    return this.repo.getOfferRequests(page, limit, search);
  }

  async verifyCourseOffer(offerId: string, status: "approved" | "rejected", reviews?: string) : Promise<ICourseOffer> {
    const offer = await this.repo.findById(offerId);
    if (!offer) throw new Error("Course offer request not found.");

    const updateData: Partial<ICourseOffer> = {
      status,
      isVerified: status === "approved",
      isActive: status === "approved",
      reviews: reviews || "",
    };

    const verify = await this.repo.updateById(offerId, updateData);

    if(!verify){
      throw new Error("admin course offer verification error")
    }

    return verify
  }

  async getOfferById(offerId: string): Promise<ICourseOffer | null> {
    return this.repo.findById(offerId);
  }
}
