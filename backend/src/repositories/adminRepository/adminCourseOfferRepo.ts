import { CourseOfferModel, ICourseOffer } from "../../models/courseOfferModel";
import { PopulatedCourseOffer } from "../../dto/adminDTO/adminCourseOfferDTO";
import { GenericRepository } from "../genericRepository";
import { IAdminCourseOfferRepo } from "./interface/IAdminCourseOfferRepo";
import { PipelineStage } from "mongoose";

export class AdminCourseOfferRepo extends GenericRepository<ICourseOffer> implements IAdminCourseOfferRepo {
  constructor() {
    super(CourseOfferModel);
  }

  async findByIdPopulated(offerId: string): Promise<PopulatedCourseOffer | null> {
    const result = await this.model
      .findById(offerId)
      .populate({ path: "courseId", select: "courseName price" })
      .populate({ path: "instructorId", select: "username email" })
      .exec();
    return result as unknown as PopulatedCourseOffer | null;
  }

  async updateByIdPopulated(offerId: string, data: Partial<ICourseOffer>): Promise<PopulatedCourseOffer | null> {
    const result = await this.model
      .findByIdAndUpdate(offerId, data, { new: true })
      .populate({ path: "courseId", select: "courseName price" })
      .populate({ path: "instructorId", select: "username email" })
      .exec();
    return result as unknown as PopulatedCourseOffer | null;
  }

  async getOfferRequests(page: number, limit: number, search?: string, status?: string): Promise<{ data: PopulatedCourseOffer[]; total: number }> {
    const pipeline: PipelineStage[] = [
      // Lookup to join with Course collection
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "courseId",
        },
      },
      { $unwind: "$courseId" }, // Unwind to get a single course object
      // Lookup to join with Instructor collection
      {
        $lookup: {
          from: "instructors",
          localField: "instructorId",
          foreignField: "_id",
          as: "instructorId",
        },
      },
      { $unwind: "$instructorId" }, // Unwind to get a single instructor object
    ];

    // Apply text search on courseName if search is provided
    if (search && search.trim() !== "") {
      pipeline.push({
        $match: {
          "courseId.courseName": { $regex: search, $options: "i" }, // Case-insensitive regex search
        },
      });
    }

    // Apply status filter if provided
    if (status && status !== "all") {
      pipeline.push({
        $match: { status },
      });
    }

    // Count total documents for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await this.model.aggregate(countPipeline).exec();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add sorting and pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      // Project only the required fields to match PopulatedCourseOffer
      {
        $project: {
          _id: 1,
          courseId: { _id: 1, courseName: 1, price: 1 },
          instructorId: { _id: 1, username: 1, email: 1 },
          discountPercentage: 1,
          startDate: 1,
          endDate: 1,
          isActive: 1,
          isVerified: 1,
          status: 1,
          reviews: 1,
          createdAt: 1,
          updatedAt: 1,
          discountedPrice: {
            $cond: {
              if: { $ne: ["$courseId.price", null] },
              then: { $multiply: ["$courseId.price", { $subtract: [1, { $divide: ["$discountPercentage", 100] }] }] },
              else: null,
            },
          },
        },
      }
    );

    const data = await this.model.aggregate<PopulatedCourseOffer>(pipeline).exec();
    return { data, total };
  }
}
