import { CourseOfferModel, ICourseOffer } from "../../models/courseOfferModel";
import { GenericRepository } from "../genericRepository";
import { IAdminCourseOfferRepo } from "./interface/IAdminCourseOfferRepo";

export class AdminCourseOfferRepo extends GenericRepository<ICourseOffer> implements IAdminCourseOfferRepo {
  constructor() {
    super(CourseOfferModel);
  }

  async findById(offerId: string): Promise<ICourseOffer | null> {
    return this.model.findById(offerId)
      .populate("courseId", "courseName price")
      .populate("instructorId", "name email")
      .exec();
  }

  async updateById(offerId: string, data: Partial<ICourseOffer>): Promise<ICourseOffer | null> {
    return this.model.findByIdAndUpdate(offerId, data, { new: true }).exec();
  }

  async getOfferRequests(page: number, limit: number, search?: string): Promise<{ data: ICourseOffer[]; total: number }> {
    let filter: any = {};
    if (search && search.trim() !== "") {
      filter = { $text: { $search: search } };
    }
    return this.paginate(filter, page, limit, { createdAt: -1 }, ["courseId", "instructorId"]);
  }
}
