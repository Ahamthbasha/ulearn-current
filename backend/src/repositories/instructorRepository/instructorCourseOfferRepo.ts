import { CourseOfferModel, ICourseOffer } from "../../models/courseOfferModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorCourseOfferRepo } from "./interface/IInstructorCourseofferRepo";
import { PipelineStage, Types } from "mongoose";

export class InstructorCourseOfferRepo
  extends GenericRepository<ICourseOffer>
  implements IInstructorCourseOfferRepo
{
  constructor() {
    super(CourseOfferModel);
  }

  async findById(offerId: string): Promise<ICourseOffer | null> {
    return this.model
      .findById(offerId)
      .populate("courseId", "courseName price")
      .exec();
  }

  async createOffer(data: Partial<ICourseOffer>): Promise<ICourseOffer> {
    return new this.model(data).save();
  }

  async updateById(
    offerId: string,
    data: Partial<ICourseOffer>,
  ): Promise<ICourseOffer | null> {
    return this.model.findByIdAndUpdate(offerId, data, { new: true }).exec();
  }

  async deleteById(
    offerId: string,
    instructorId: string,
  ): Promise<ICourseOffer | null> {
    return this.model.findOneAndDelete({ _id: offerId, instructorId }).exec();
  }

  async getOffersByInstructor(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: ICourseOffer[]; total: number }> {
    const pipeline: PipelineStage[] = [
      // Match offers by instructorId
      { $match: { instructorId: new Types.ObjectId(instructorId) } },
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

    // Add sorting, pagination, and projection
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      // Project fields to match ICourseOffer with populated courseId
      {
        $project: {
          _id: 1,
          courseId: { _id: 1, courseName: 1, price: 1 },
          instructorId: 1,
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
              then: {
                $multiply: [
                  "$courseId.price",
                  { $subtract: [1, { $divide: ["$discountPercentage", 100] }] },
                ],
              },
              else: null,
            },
          },
        },
      },
    );

    const data = await this.model.aggregate<ICourseOffer>(pipeline).exec();
    return { data, total };
  }

  async getActiveOfferByCourseId(
    courseId: string,
  ): Promise<ICourseOffer | null> {
    return await this.findOne({
      courseId: new Types.ObjectId(courseId),
      isActive: true,
      isVerified: true,
      status: "approved",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });
  }
}
