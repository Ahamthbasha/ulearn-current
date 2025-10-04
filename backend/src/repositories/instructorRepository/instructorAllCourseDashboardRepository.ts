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
      { $match: { "courses.instructorId": instructorId } },
      {
        $group: {
          _id: "$courses.courseId",
          courseName: { $first: "$courses.courseName" },
          thumbnailUrl: { $first: "$courses.thumbnailUrl" },
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
      { $match: { "courses.instructorId": instructorId } },
      {
        $lookup: {
          from: "courses",
          localField: "courses.courseId",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      { $unwind: "$courseInfo" },
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
          _id: 0,
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
      { $unwind: "$courses" },
      { $match: { "courses.instructorId": instructorId } },
      {
        $addFields: {
          perCourseDiscount: {
            $round: [
              {
                $cond: {
                  if: { $gt: ["$totalCourseCount", 0] },
                  then: { $divide: [{ $ifNull: ["$coupon.discountAmount", 0] }, "$totalCourseCount"] },
                  else: 0,
                },
              },
              2,
            ],
          },
          effectiveCoursePrice: {
            $round: [
              {
                $subtract: [
                  { $ifNull: ["$courses.offerPrice", "$courses.coursePrice"] },
                  {
                    $cond: {
                      if: { $gt: ["$totalCourseCount", 0] },
                      then: { $divide: [{ $ifNull: ["$coupon.discountAmount", 0] }, "$totalCourseCount"] },
                      else: 0,
                    },
                  },
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: {
            $sum: {
              $round: [{ $multiply: ["$effectiveCoursePrice", 0.9] }, 2],
            },
          },
          totalSales: { $sum: 1 },
        },
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          totalRevenue: { $round: ["$totalRevenue", 2] },
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
      { $unwind: "$courses" },
      { $match: { "courses.instructorId": instructorId } },
      {
        $addFields: {
          perCourseDiscount: {
            $round: [
              {
                $cond: {
                  if: { $gt: ["$totalCourseCount", 0] },
                  then: { $divide: [{ $ifNull: ["$coupon.discountAmount", 0] }, "$totalCourseCount"] },
                  else: 0,
                },
              },
              2,
            ],
          },
          effectiveCoursePrice: {
            $round: [
              {
                $subtract: [
                  { $ifNull: ["$courses.offerPrice", "$courses.coursePrice"] },
                  {
                    $cond: {
                      if: { $gt: ["$totalCourseCount", 0] },
                      then: { $divide: [{ $ifNull: ["$coupon.discountAmount", 0] }, "$totalCourseCount"] },
                      else: 0,
                    },
                  },
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $round: [{ $multiply: ["$effectiveCoursePrice", 0.9] }, 2],
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
      { $match: { "courses.instructorId": instructorId } },
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

    const dataAggregation = await this._orderRepo.aggregate<IRevenueReportItem>([
      { $match: matchStage },
      {
        $addFields: {
          totalCourseCount: { $size: "$courses" },
        },
      },
      { $unwind: "$courses" },
      { $match: { "courses.instructorId": instructorId } },
      {
        $addFields: {
          perCourseDiscount: {
            $round: [
              {
                $cond: {
                  if: { $gt: ["$totalCourseCount", 0] },
                  then: { $divide: [{ $ifNull: ["$coupon.discountAmount", 0] }, "$totalCourseCount"] },
                  else: 0,
                },
              },
              2,
            ],
          },
          effectiveCoursePrice: {
            $round: [
              {
                $subtract: [
                  { $ifNull: ["$courses.offerPrice", "$courses.coursePrice"] },
                  {
                    $cond: {
                      if: { $gt: ["$totalCourseCount", 0] },
                      then: { $divide: [{ $ifNull: ["$coupon.discountAmount", 0] }, "$totalCourseCount"] },
                      else: 0,
                    },
                  },
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "coupon.couponId",
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
      {
        $group: {
          _id: {
            orderId: "$_id",
            createdAt: "$createdAt",
            totalOrderAmount: "$amount",
          },
          courses: {
            $push: {
              courseName: "$courses.courseName",
              courseOriginalPrice: "$courses.coursePrice",
              courseOfferPrice: { $ifNull: ["$courses.offerPrice", "$courses.coursePrice"] },
              couponCode: { $ifNull: ["$couponInfo.code", "N/A"] },
              couponDiscountAmount: "$perCourseDiscount",
              couponDiscount: { $ifNull: ["$coupon.discountPercentage", 0] },
              finalCoursePrice: "$effectiveCoursePrice",
            },
          },
          instructorEarning: {
            $sum: {
              $round: [{ $multiply: ["$effectiveCoursePrice", 0.9] }, 2],
            },
          },
        },
      },
      {
        $project: {
          orderId: "$_id.orderId",
          orderDate: {
            $concat: [
              {
                $dateToString: {
                  format: "%d-%m-%Y ",
                  date: "$_id.createdAt",
                },
              },
              {
                $cond: {
                  if: { $gte: [{ $hour: "$_id.createdAt" }, 12] },
                  then: {
                    $concat: [
                      {
                        $toString: {
                          $cond: {
                            if: { $eq: [{ $hour: "$_id.createdAt" }, 12] },
                            then: 12,
                            else: { $mod: [{ $hour: "$_id.createdAt" }, 12] },
                          },
                        },
                      },
                      ":",
                      {
                        $dateToString: {
                          format: "%M:%S",
                          date: "$_id.createdAt",
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
                            if: { $eq: [{ $hour: "$_id.createdAt" }, 0] },
                            then: 12,
                            else: { $hour: "$_id.createdAt" },
                          },
                        },
                      },
                      ":",
                      {
                        $dateToString: {
                          format: "%M:%S",
                          date: "$_id.createdAt",
                        },
                      },
                      " AM",
                    ],
                  },
                },
              },
            ],
          },
          courses: 1,
          instructorEarning: { $round: ["$instructorEarning", 2] },
          totalOrderAmount: "$_id.totalOrderAmount",
          _id: 0,
        },
      },
      { $sort: { orderDate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const countAggregation = await this._orderRepo.aggregate<{ total: number }>([
      { $match: matchStage },
      { $unwind: "$courses" },
      { $match: { "courses.instructorId": instructorId } },
      { $group: { _id: "$_id" } },
      { $count: "total" },
    ]);

    const total = countAggregation[0]?.total || 0;

    return { data: dataAggregation, total };
  }
}