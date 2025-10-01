import { Types } from "mongoose";
import { IInstructorAllCourseDashboardRepository } from "./interface/IInstructorAllCourseDashboardRepository";
import { IGenericRepository } from "../genericRepository";
import { IOrder } from "../../models/orderModel";
import {
  ITopSellingCourse,
  ICategorySales,
  IMonthlySales,
  IRevenueReportItem,
} from "../../interface/instructorInterface/IInstructorInterface";
import { ICourse } from "../../models/courseModel";

export class InstructorAllCourseDashboardRepository
  implements IInstructorAllCourseDashboardRepository
{
  private _orderRepo: IGenericRepository<IOrder>;
  private _courseRepo: IGenericRepository<ICourse>;

  constructor(orderRepo: IGenericRepository<IOrder>, courseRepo: IGenericRepository<ICourse>) {
    this._orderRepo = orderRepo;
    this._courseRepo = courseRepo;
  }

  async getTopSellingCourses(
    instructorId: Types.ObjectId,
  ): Promise<ITopSellingCourse[]> {
    return this._orderRepo.aggregate<ITopSellingCourse>([
      { $match: { status: "SUCCESS" } },
      { $unwind: "$courses" },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.instructorId": instructorId } },
      {
        $group: {
          _id: "$courses",
          courseName: { $first: "$courseInfo.courseName" },
          thumbnailUrl: { $first: "$courseInfo.thumbnailUrl" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);
  }

  async getCategoryWiseSales(
    instructorId: Types.ObjectId,
  ): Promise<ICategorySales[]> {
    return this._orderRepo.aggregate<ICategorySales>([
      { $match: { status: "SUCCESS" } },
      { $unwind: "$courses" },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.instructorId": instructorId } },
      {
        $group: {
          _id: "$courseInfo.category",
          totalSales: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $project: {
          categoryName: { $arrayElemAt: ["$categoryInfo.categoryName", 0] },
          totalSales: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);
  }

  async getMonthlySalesGraph(
    instructorId: Types.ObjectId,
  ): Promise<IMonthlySales[]> {
    return this._orderRepo.aggregate<IMonthlySales>([
      { $match: { status: "SUCCESS" } },
      {
        $addFields: {
          totalCourseCount: { $size: "$courses" },
        },
      },
      // Lookup all courses first to calculate total order price
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "allCoursesInfo",
        },
      },
      {
        $addFields: {
          totalOrderPrice: {
            $sum: "$allCoursesInfo.price",
          },
        },
      },
      {
        $addFields: {
          totalDiscountAmount: {
            $subtract: ["$totalOrderPrice", "$amount"],
          },
        },
      },
      {
        $addFields: {
          perCourseDiscount: {
            $cond: {
              if: { $gt: ["$totalCourseCount", 0] },
              then: { $divide: ["$totalDiscountAmount", "$totalCourseCount"] },
              else: 0,
            },
          },
        },
      },
      { $unwind: "$courses" },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.instructorId": instructorId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: {
            $sum: {
              $multiply: [
                { $subtract: ["$courseInfo.price", "$perCourseDiscount"] },
                0.9,
              ],
            },
          },
          totalSales: { $sum: 1 },
        },
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          totalRevenue: 1,
          totalSales: 1,
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);
  }

  async getTotalRevenue(instructorId: Types.ObjectId): Promise<number> {
    const result = await this._orderRepo.aggregate<{ total: number }>([
      { $match: { status: "SUCCESS" } },
      {
        $addFields: {
          totalCourseCount: { $size: "$courses" },
        },
      },
      // Lookup all courses first to calculate total order price
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "allCoursesInfo",
        },
      },
      {
        $addFields: {
          totalOrderPrice: {
            $sum: "$allCoursesInfo.price",
          },
        },
      },
      {
        $addFields: {
          totalDiscountAmount: {
            $subtract: ["$totalOrderPrice", "$amount"],
          },
        },
      },
      {
        $addFields: {
          perCourseDiscount: {
            $cond: {
              if: { $gt: ["$totalCourseCount", 0] },
              then: { $divide: ["$totalDiscountAmount", "$totalCourseCount"] },
              else: 0,
            },
          },
        },
      },
      { $unwind: "$courses" },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.instructorId": instructorId } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $multiply: [
                { $subtract: ["$courseInfo.price", "$perCourseDiscount"] },
                0.9,
              ],
            },
          },
        },
      },
    ]);
    return result[0]?.total || 0;
  }

  async getTotalCourseSales(instructorId: Types.ObjectId): Promise<number> {
    const result = await this._orderRepo.aggregate<{ totalSales: number }>([
      { $match: { status: "SUCCESS" } },
      { $unwind: "$courses" },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.instructorId": instructorId } },
      { $count: "totalSales" },
    ]);
    return result[0]?.totalSales || 0;
  }

  async getPublishedCoursesCount(instructorId: Types.ObjectId): Promise<number> {
    const result = await this._courseRepo.aggregate<{ total: number }>([
      {
        $match: {
          instructorId: instructorId,
          isPublished: true,
        },
      },
      { $count: "total" },
    ]);
    return result[0]?.total || 0;
  }

  async getCategoryWiseCreatedCourses(
    instructorId: Types.ObjectId,
  ): Promise<number> {
    const result = await this._courseRepo.aggregate<{ totalCategories: number }>([
      {
        $match: {
          instructorId: instructorId,
          isPublished: true,
        },
      },
      {
        $group: {
          _id: null,
          uniqueCategories: { $addToSet: "$category" },
        },
      },
      {
        $project: {
          totalCategories: { $size: "$uniqueCategories" },
          _id: 0,
        },
      },
    ]);
    return result[0]?.totalCategories || 0;
  }

  async getDetailedRevenueReport(
    instructorId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ data: IRevenueReportItem[]; total: number }> {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (range) {
      case "daily":
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        if (!startDate || !endDate) {
          throw new Error("Start and end date required for custom range");
        }
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error("Invalid range");
    }

    const matchStage = {
      status: "SUCCESS",
      createdAt: { $gte: start, $lte: end },
    };

    const dataAggregation = await this._orderRepo.aggregate<IRevenueReportItem>(
      [
        { $match: matchStage },
        {
          $addFields: {
            totalCourseCount: { $size: "$courses" },
          },
        },
        // Lookup all courses first to calculate total order price
        {
          $lookup: {
            from: "courses",
            localField: "courses",
            foreignField: "_id",
            as: "allCoursesInfo",
          },
        },
        {
          $addFields: {
            totalOrderPrice: {
              $sum: "$allCoursesInfo.price",
            },
          },
        },
        {
          $addFields: {
            totalDiscountAmount: {
              $subtract: ["$totalOrderPrice", "$amount"],
            },
          },
        },
        {
          $addFields: {
            perCourseDiscount: {
              $cond: {
                if: { $gt: ["$totalCourseCount", 0] },
                then: { $divide: ["$totalDiscountAmount", "$totalCourseCount"] },
                else: 0,
              },
            },
          },
        },
        { $unwind: "$courses" },
        {
          $lookup: {
            from: "courses",
            localField: "courses",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        { $unwind: "$courseInfo" },
        {
          $match: {
            "courseInfo.instructorId": instructorId,
          },
        },
        {
          $lookup: {
            from: "payments",
            localField: "_id",
            foreignField: "orderId",
            as: "paymentInfo",
          },
        },
        {
          $unwind: {
            path: "$paymentInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "coupons",
            localField: "couponId",
            foreignField: "_id",
            as: "couponInfo",
          },
        },
        {
          $unwind: {
            path: "$couponInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            createdAt: {
              $concat: [
                {
                  $dateToString: {
                    format: "%d-%m-%Y ",
                    date: "$createdAt",
                  },
                },
                {
                  $cond: {
                    if: { $gte: [{ $hour: "$createdAt" }, 12] },
                    then: {
                      $concat: [
                        {
                          $toString: {
                            $cond: {
                              if: { $eq: [{ $hour: "$createdAt" }, 12] },
                              then: 12,
                              else: { $mod: [{ $hour: "$createdAt" }, 12] },
                            },
                          },
                        },
                        ":",
                        {
                          $dateToString: {
                            format: "%M:%S",
                            date: "$createdAt",
                          },
                        },
                        " PM",
                      ],
                    },
                    else: {
                      $concat: [
                        {
                          $toString: {
                            $cond: {
                              if: { $eq: [{ $hour: "$createdAt" }, 0] },
                              then: 12,
                              else: { $hour: "$createdAt" },
                            },
                          },
                        },
                        ":",
                        {
                          $dateToString: {
                            format: "%M:%S",
                            date: "$createdAt",
                          },
                        },
                        " AM",
                      ],
                    },
                  },
                },
              ],
            },
            orderId: "$_id",
            paymentMethod: { $ifNull: ["$paymentInfo.method", "N/A"] },
            courseName: "$courseInfo.courseName",
            courseOriginalPrice: "$courseInfo.price",
            couponCode: { $ifNull: ["$couponInfo.code", "N/A"] },
            couponDiscount: { $ifNull: ["$couponInfo.discount", 0] },
            courseDiscountAmount: "$perCourseDiscount",
            finalCoursePrice: {
              $subtract: ["$courseInfo.price", "$perCourseDiscount"],
            },
            instructorEarning: {
              $multiply: [
                { $subtract: ["$courseInfo.price", "$perCourseDiscount"] },
                0.9,
              ],
            },
            totalOrderAmount: "$amount",
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ],
    );

    const countAggregation = await this._orderRepo.aggregate<{ total: number }>(
      [
        { $match: matchStage },
        { $unwind: "$courses" },
        {
          $lookup: {
            from: "courses",
            localField: "courses",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        { $unwind: "$courseInfo" },
        {
          $match: {
            "courseInfo.instructorId": instructorId,
          },
        },
        { $count: "total" },
      ],
    );

    const total = countAggregation[0]?.total || 0;

    return { data: dataAggregation, total };
  }

}