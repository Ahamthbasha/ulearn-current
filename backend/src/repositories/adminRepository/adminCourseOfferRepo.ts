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
    const pipeline: any[] = [
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "courseId",
        },
      },
      {
        $unwind: "$courseId",
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
      {
        $project: {
          data: 1,
          total: { $arrayElemAt: ["$total.count", 0] },
        },
      },
    ];

    // Add $match stage only if search is provided and non-empty
    if (search && search.trim().length > 0) {
      pipeline.splice(2, 0, {
        $match: {
          $expr: {
            $regexMatch: {
              input: "$courseId.courseName", // Directly use the courseName field
              regex: search,
              options: "i",
            },
          },
        },
      });
    }

    const result = await this.model.aggregate(pipeline).exec();
    const { data, total } = result[0] || { data: [], total: 0 };
    return { data, total: total || 0 };
  }

  async getCourseOfferById(offerId: string): Promise<ICourseOffer | null> {
    return this.model
      .findOne({ _id: offerId })
      .populate({ path: "courseId", select: "courseName" })
      .exec();
  }
}