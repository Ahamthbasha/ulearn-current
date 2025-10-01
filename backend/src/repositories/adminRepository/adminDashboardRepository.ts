import { IAdminDashboardRepository } from "./interface/IAdminDashboardRepository";
import { CourseRepository } from "../CourseRepository";
import { OrderRepository } from "../OrderRepository";
import { InstructorMembershipOrder } from "../InstructorMemberShirpOrderRepository";
import IInstructorRepository from "../instructorRepository/interface/IInstructorRepository";
import {
  IAdminCourseSalesReportItem,
  IAdminMembershipReportItem,
} from "../../types/dashboardTypes";
import { PipelineStage } from "mongoose";

export class AdminDashboardRepository implements IAdminDashboardRepository {
  private _instructorRepo: IInstructorRepository;
  private _courseRepo: CourseRepository;
  private _orderRepo: OrderRepository;
  private _membershipOrderRepo: InstructorMembershipOrder;

  constructor(
    instructorRepo: IInstructorRepository,
    courseRepo: CourseRepository,
    orderRepo: OrderRepository,
    membershipOrderRepo: InstructorMembershipOrder,
  ) {
    this._instructorRepo = instructorRepo;
    this._courseRepo = courseRepo;
    this._orderRepo = orderRepo;
    this._membershipOrderRepo = membershipOrderRepo;
  }

  async getInstructorCount(): Promise<number> {
    return await this._instructorRepo.getInstructorCount();
  }

  async getMentorCount(): Promise<number> {
    return await this._instructorRepo.getMentorCount();
  }

  async getCourseCount(): Promise<number> {
    return await this._courseRepo.countDocuments({});
  }

  async getTotalMembershipRevenue(): Promise<number> {
    const result = await this._membershipOrderRepo.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);
    return result[0]?.total || 0;
  }

async getMonthlyCourseSales(): Promise<
  { month: number; year: number; total: number }[]
> {
  return await this._orderRepo.aggregate([
    { $match: { status: "SUCCESS" } },
    { $unwind: "$courses" },
    {
      $lookup: {
        from: "courses",
        localField: "courses",
        foreignField: "_id",
        as: "courseDetails",
      },
    },
    { $unwind: "$courseDetails" },
    {
      $group: {
        _id: "$_id",
        month: { $first: { $month: "$createdAt" } },
        year: { $first: { $year: "$createdAt" } },
        totalCoursePrice: { $sum: "$courseDetails.price" },
        orderAmount: { $first: "$amount" },
        courseCount: { $sum: 1 },
        coursePrices: { $push: "$courseDetails.price" }
      },
    },
    {
      $addFields: {
        discountAmount: { $subtract: ["$totalCoursePrice", "$orderAmount"] },
      },
    },
    {
      $addFields: {
        eachCourseDeductionAmount: {
          $cond: {
            if: { $gt: ["$courseCount", 0] },
            then: { $divide: ["$discountAmount", "$courseCount"] },
            else: 0,
          },
        },
      },
    },
    { $unwind: "$coursePrices" },
    {
      $addFields: {
        finalCoursePrice: { $subtract: ["$coursePrices", "$eachCourseDeductionAmount"] },
      },
    },
    {
      $addFields: {
        adminShare: { $multiply: ["$finalCoursePrice", 0.1] },
      },
    },
    {
      $group: {
        _id: {
          month: "$month",
          year: "$year",
        },
        total: { $sum: "$adminShare" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        month: "$_id.month",
        year: "$_id.year",
        total: 1,
      },
    },
  ]);
}


async getTotalCourseRevenue(): Promise<number> {
  const result = await this._orderRepo.aggregate([
    { $match: { status: "SUCCESS" } },
    { $unwind: "$courses" },
    {
      $lookup: {
        from: "courses",
        localField: "courses",
        foreignField: "_id",
        as: "courseDetails",
      },
    },
    { $unwind: "$courseDetails" },
    {
      $group: {
        _id: "$_id",
        totalCoursePrice: { $sum: "$courseDetails.price" },
        orderAmount: { $first: "$amount" },
        courseCount: { $sum: 1 },
        courses: { $push: "$courseDetails.price" }
      },
    },
    {
      $project: {
        totalCoursePrice: 1,
        orderAmount: 1,
        courseCount: 1,
        courses: 1,
        discountAmount: { $subtract: ["$totalCoursePrice", "$orderAmount"] },
      },
    },
    {
      $project: {
        courseCount: 1,
        courses: 1,
        eachCourseDeductionAmount: {
          $cond: {
            if: { $gt: ["$courseCount", 0] },
            then: { $divide: ["$discountAmount", "$courseCount"] },
            else: 0,
          },
        },
      },
    },
    { $unwind: "$courses" },
    {
      $project: {
        finalCoursePrice: { $subtract: ["$courses", "$eachCourseDeductionAmount"] },
      },
    },
    {
      $project: {
        adminShare: { $multiply: ["$finalCoursePrice", 0.1] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$adminShare" },
      },
    },
  ]);
  return result[0]?.total || 0;
}

  async getMonthlyMembershipSales(): Promise<
    { month: number; year: number; total: number }[]
  > {
    return await this._membershipOrderRepo.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          total: { $sum: "$price" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          total: 1,
        },
      },
    ]);
  }

  async getCourseSalesReportFiltered(
    filter: {
      type: "daily" | "weekly" | "monthly" | "custom";
      startDate?: Date;
      endDate?: Date;
    },
    page?: number,
    limit?: number,
  ): Promise<{
    items: IAdminCourseSalesReportItem[];
    totalItems: number;
  }> {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (filter.type) {
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
      case "custom":
        if (!filter.startDate || !filter.endDate) {
          throw new Error("Custom filter requires startDate and endDate");
        }
        start = new Date(filter.startDate);
        end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error("Invalid filter type");
    }

    const aggregation: PipelineStage[] = [
      {
        $match: {
          status: "SUCCESS",
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $unwind: "$courses" },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      { $unwind: "$courseDetails" },
      {
        $lookup: {
          from: "instructors",
          localField: "courseDetails.instructorId",
          foreignField: "_id",
          as: "instructor",
        },
      },
      { $unwind: "$instructor" },
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "couponDetails",
        },
      },
      { $unwind: { path: "$couponDetails", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          orderId: { $first: "$_id" },
          date: { $first: "$createdAt" },
          totalCoursePrice: { $sum: "$courseDetails.price" },
          orderAmount: { $first: "$amount" },
          courseCount: { $sum: 1 },
          couponCode: { $first: "$couponDetails.code" },
          courses: {
            $push: {
              courseName: "$courseDetails.courseName",
              instructorName: "$instructor.username",
              coursePrice: "$courseDetails.price",
            },
          },
        },
      },
      {
        $project: {
          orderId: 1,
          date: 1,
          courses: 1,
          totalPrice: "$totalCoursePrice",
          discountAmount: { $subtract: ["$totalCoursePrice", "$orderAmount"] },
          courseCount: 1,
          couponCode: 1,
        },
      },
      {
        $project: {
          orderId: 1,
          date: 1,
          courses: {
            $map: {
              input: "$courses",
              as: "course",
              in: {
                courseName: "$$course.courseName",
                instructorName: "$$course.instructorName",
                coursePrice: "$$course.coursePrice",
                discountedPrice: {
                  $subtract: [
                    "$$course.coursePrice",
                    {
                      $cond: {
                        if: { $gt: ["$courseCount", 0] },
                        then: { $divide: ["$discountAmount", "$courseCount"] },
                        else: 0,
                      },
                    },
                  ],
                },
                adminShare: {
                  $multiply: [
                    {
                      $subtract: [
                        "$$course.coursePrice",
                        {
                          $cond: {
                            if: { $gt: ["$courseCount", 0] },
                            then: { $divide: ["$discountAmount", "$courseCount"] },
                            else: 0,
                          },
                        },
                      ],
                    },
                    0.1,
                  ],
                },
              },
            },
          },
          totalPrice: 1,
          discountAmount: 1,
          couponCode: 1,
          totalAdminShare: {
            $sum: {
              $map: {
                input: "$courses",
                as: "course",
                in: {
                  $multiply: [
                    {
                      $subtract: [
                        "$$course.coursePrice",
                        {
                          $cond: {
                            if: { $gt: ["$courseCount", 0] },
                            then: { $divide: ["$discountAmount", "$courseCount"] },
                            else: 0,
                          },
                        },
                      ],
                    },
                    0.1,
                  ],
                },
              },
            },
          },
        },
      },
    ];

    const totalItems = await this._orderRepo
      .aggregate([
        {
          $match: { status: "SUCCESS", createdAt: { $gte: start, $lte: end } },
        },
        { $group: { _id: null, count: { $sum: 1 } } },
      ])
      .then((result) => result[0]?.count || 0);

    if (page && limit) {
      aggregation.push({ $skip: (page - 1) * limit });
      aggregation.push({ $limit: limit });
    }

    const items =
      await this._orderRepo.aggregate<IAdminCourseSalesReportItem>(aggregation);

    return { items, totalItems };
  }

  async getMembershipSalesReportFiltered(
    filter: {
      type: "daily" | "weekly" | "monthly" | "custom";
      startDate?: Date;
      endDate?: Date;
    },
    page?: number,
    limit?: number,
  ): Promise<{
    items: IAdminMembershipReportItem[];
    totalItems: number;
  }> {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (filter.type) {
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
      case "custom":
        if (!filter.startDate || !filter.endDate) {
          throw new Error("Custom filter requires startDate and endDate");
        }
        start = new Date(filter.startDate);
        end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error("Invalid filter type");
    }

    const aggregation: PipelineStage[] = [
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "instructors",
          localField: "instructorId",
          foreignField: "_id",
          as: "instructorDetails",
        },
      },
      { $unwind: "$instructorDetails" },
      {
        $lookup: {
          from: "membershipplans",
          localField: "membershipPlanId",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      { $unwind: "$planDetails" },
      {
        $project: {
          _id: 0,
          orderId: "$_id",
          date: "$createdAt",
          instructorName: "$instructorDetails.username",
          planName: "$planDetails.name",
          price: "$price",
        },
      },
    ];

    const totalItems = await this._membershipOrderRepo
      .aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, count: { $sum: 1 } } },
      ])
      .then((result) => result[0]?.count || 0);

    if (page && limit) {
      aggregation.push({ $skip: (page - 1) * limit });
      aggregation.push({ $limit: limit });
    }

    const items =
      await this._membershipOrderRepo.aggregate<IAdminMembershipReportItem>(
        aggregation,
      );

    return { items, totalItems };
  }

  async getTopSellingCourses(
    limit = 3,
  ): Promise<{ courseName: string; salesCount: number }[]> {
    return await this._orderRepo.aggregate([
      { $match: { status: "SUCCESS" } },
      { $unwind: "$courses" },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      { $unwind: "$courseDetails" },
      {
        $group: {
          _id: "$courseDetails._id",
          courseName: { $first: "$courseDetails.courseName" },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { salesCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          courseName: 1,
          salesCount: 1,
        },
      },
    ]);
  }

  async getTopSellingCategories(
    limit = 3,
  ): Promise<{ categoryName: string }[]> {
    return await this._orderRepo.aggregate([
      { $match: { status: "SUCCESS" } },
      { $unwind: "$courses" },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      { $unwind: "$courseDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "courseDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$courseDetails.category",
          categoryName: { $first: "$categoryDetails.categoryName" },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { salesCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          categoryName: 1,
        },
      },
    ]);
  }
}