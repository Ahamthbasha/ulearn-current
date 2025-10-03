import { ICategoryOffer, CategoryOfferModel } from "../../models/categoryOfferModel";
import { GenericRepository } from "../genericRepository";
import { IAdminCategoryOfferRepo } from "./interface/IAdminCategoryOfferRepo";

export class AdminCategoryOfferRepo
  extends GenericRepository<ICategoryOffer>
  implements IAdminCategoryOfferRepo
{
  constructor() {
    super(CategoryOfferModel);
  }

  async findById(categoryOfferId: string): Promise<ICategoryOffer | null> {
    return this.findOne({ _id: categoryOfferId });
  }

  async updateById(
    categoryOfferId: string,
    data: Partial<ICategoryOffer>,
  ): Promise<ICategoryOffer | null> {
    return this.updateOne({ _id: categoryOfferId }, data);
  }

  async toggleActiveById(categoryOfferId: string): Promise<ICategoryOffer | null> {
    const offer = await this.findById(categoryOfferId);
    if (!offer) return null;

    const updateData = { isActive: !offer.isActive };
    return this.updateById(categoryOfferId, updateData);
  }

  async deleteById(categoryOfferId: string): Promise<ICategoryOffer | null> {
    return this.findOneAndDelete({ _id: categoryOfferId });
  }

  async getCategoryOffers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ICategoryOffer[]; total: number }> {
    const pipeline: any[] = [
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryId",
        },
      },
      {
        $unwind: "$categoryId",
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
              input: "$categoryId.categoryName",
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

  async getCategoryOfferById(categoryOfferId: string): Promise<ICategoryOffer | null> {
    return this.model
      .findOne({ _id: categoryOfferId })
      .populate([
        { path: "categoryId", select: "categoryName" },
        { path: "courseOffers", select: "courseId discountPercentage startDate endDate isActive" },
      ])
      .exec();
  }
}