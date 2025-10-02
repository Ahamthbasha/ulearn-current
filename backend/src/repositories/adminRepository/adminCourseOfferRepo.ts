import { ICourseOffer, CourseOfferModel } from "../../models/courseOfferModel"; 
import { GenericRepository } from "../genericRepository";
import { IAdminCourseOfferRepo } from "./interface/IAdminCourseOfferRepo"; 

export class AdminCourseOfferRepo
  extends GenericRepository<ICourseOffer>
  implements IAdminCourseOfferRepo
{
  constructor() {
    super(CourseOfferModel);
  }

  async findById(offerId: string): Promise<ICourseOffer | null> {
    return this.findOne({ _id: offerId });
  }

  async updateById(
    offerId: string,
    data: Partial<ICourseOffer>,
  ): Promise<ICourseOffer | null> {
    return this.updateOne({ _id: offerId }, data);
  }

  async toggleActiveById(offerId: string): Promise<ICourseOffer | null> {
    const offer = await this.findById(offerId);
    if (!offer) return null;

    const updateData = { isActive: !offer.isActive };
    return this.updateById(offerId, updateData);
  }

  async deleteById(offerId: string): Promise<ICourseOffer | null> {
    return this.findOneAndDelete({ _id: offerId });
  }

  async getCourseOffers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ICourseOffer[]; total: number }> {
    const filter: any = {};
    if (search) {
      filter["$or"] = [
        { "courseId.courseName": { $regex: search, $options: "i" } },
      ];
    }

    const populate = [
      { path: "courseId", select: "courseName" },
    ];

    return this.paginate(filter, page, limit, { createdAt: -1 }, populate);
  }

  async getCourseOfferById(offerId: string): Promise<ICourseOffer | null> {
    return this.model
      .findOne({ _id: offerId })
      .populate({ path: "courseId", select: "courseName" })
      .exec();
  }
}