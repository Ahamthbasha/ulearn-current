import { Types } from "mongoose";
import { IInstructorAllCourseDashboardRepository } from "../interfaces/IInstructorAllCourseDashboardRepository";
import { IGenericRepository } from "../genericRepository";
import { IOrder } from "../../models/orderModel";
import {
  ITopSellingCourse,
  ICategorySales,
  IMonthlySales,
} from "../../types/dashboardTypes";

export class InstructorAllCourseDashboardRepository
  implements IInstructorAllCourseDashboardRepository
{
  private orderRepo: IGenericRepository<IOrder>;

  constructor(orderRepo: IGenericRepository<IOrder>) {
    this.orderRepo = orderRepo;
  }

  async getTopSellingCourses(
    instructorId: Types.ObjectId
  ): Promise<ITopSellingCourse[]> {
    return this.orderRepo.aggregate<ITopSellingCourse>([
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
    instructorId: Types.ObjectId
  ): Promise<ICategorySales[]> {
    return this.orderRepo.aggregate<ICategorySales>([
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
    instructorId: Types.ObjectId
  ): Promise<IMonthlySales[]> {
    return this.orderRepo.aggregate<IMonthlySales>([
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
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: {
            $sum: { $multiply: ["$courseInfo.price", 0.9] }, // Instructor's 90%
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
    const result = await this.orderRepo.aggregate([
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
          _id: null,
          total: { $sum: { $multiply: ["$courseInfo.price", 0.9] } }, // Instructor's 90%
        },
      },
    ]);
    return result[0]?.total || 0;
  }

  async getTotalCourseSales(instructorId: Types.ObjectId): Promise<number> {
    const result = await this.orderRepo.aggregate([
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

  // async getDetailedRevenueReport(
  //   instructorId: Types.ObjectId,
  //   range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  //   startDate?: Date,
  //   endDate?: Date
  // ): Promise<any[]> {
  //   const now = new Date();
  //   let start: Date;
  //   let end: Date = now;

  //   switch (range) {
  //     case "daily":
  //       start = new Date();
  //       start.setHours(0, 0, 0, 0);
  //       end = new Date();
  //       end.setHours(23, 59, 59, 999);
  //       break;
  //     case "weekly":
  //       start = new Date(now);
  //       start.setDate(now.getDate() - now.getDay());
  //       start.setHours(0, 0, 0, 0);
  //       break;
  //     case "monthly":
  //       start = new Date(now.getFullYear(), now.getMonth(), 1);
  //       break;
  //     case "yearly":
  //       start = new Date(now.getFullYear(), 0, 1);
  //       break;
  //     case "custom":
  //       if (!startDate || !endDate) {
  //         throw new Error("Start and end date required for custom range");
  //       }
  //       start = new Date(startDate);
  //       end = new Date(endDate);
  //       end.setHours(23, 59, 59, 999);
  //       break;
  //     default:
  //       throw new Error("Invalid range");
  //   }

  //   return this.orderRepo.aggregate([
  //     {
  //       $match: {
  //         status: "SUCCESS",
  //         createdAt: { $gte: start, $lte: end },
  //       },
  //     },
  //     { $unwind: "$courses" },
  //     {
  //       $lookup: {
  //         from: "courses",
  //         localField: "courses",
  //         foreignField: "_id",
  //         as: "courseInfo",
  //       },
  //     },
  //     { $unwind: "$courseInfo" },
  //     {
  //       $match: {
  //         "courseInfo.instructorId": instructorId,
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "payments",
  //         localField: "_id", // order ID
  //         foreignField: "orderId", // in payments collection
  //         as: "paymentInfo",
  //       },
  //     },
  //     {
  //       $unwind: {
  //         path: "$paymentInfo",
  //         preserveNullAndEmptyArrays: true,
  //       },
  //     },
  //     {
  //       $project: {
  //         createdAt: 1,
  //         orderId: "$_id",
  //         paymentMethod: { $ifNull: ["$paymentInfo.method", "N/A"] },
  //         courseName: "$courseInfo.courseName",
  //         coursePrice: "$courseInfo.price",
  //         instructorEarning: { $multiply: ["$courseInfo.price", 0.9] },
  //         totalOrderAmount: "$amount",
  //       },
  //     },
  //     { $sort: { createdAt: -1 } },
  //   ]);
  // }

  async getDetailedRevenueReport(
  instructorId: Types.ObjectId,
  range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  page: number,
  limit: number,
  startDate?: Date,
  endDate?: Date
): Promise<{ data: any[]; total: number }> {
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

  // Aggregation for paginated data
  const dataAggregation = await this.orderRepo.aggregate([
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
      $project: {
        createdAt: 1,
        orderId: "$_id",
        paymentMethod: { $ifNull: ["$paymentInfo.method", "N/A"] },
        courseName: "$courseInfo.courseName",
        coursePrice: "$courseInfo.price",
        instructorEarning: { $multiply: ["$courseInfo.price", 0.9] },
        totalOrderAmount: "$amount",
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  // Aggregation for total count
  const countAggregation = await this.orderRepo.aggregate([
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
  ]);

  const total = countAggregation[0]?.total || 0;

  return { data: dataAggregation, total };
}
}
