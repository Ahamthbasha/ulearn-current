import { Types } from "mongoose";
import { IInstructorAllCourseDashboardRepository } from "./interface/IInstructorAllCourseDashboardRepository";
import { IGenericRepository } from "../genericRepository";
import { IOrder } from "../../models/orderModel";
import { ILearningPath } from "../../models/learningPathModel";
import { ICourse } from "../../models/courseModel";
import {
  ITopSellingCourse,
  ITopSellingLearningPath,
  ICategorySales,
  IMonthlySales,
  IRevenueReportItem,
} from "../../interface/instructorInterface/IInstructorInterface";

export class InstructorAllCourseDashboardRepository
  implements IInstructorAllCourseDashboardRepository
{
  private _orderRepo: IGenericRepository<IOrder>;
  private _courseRepo: IGenericRepository<ICourse>;
  private _learningPathRepo: IGenericRepository<ILearningPath>;

  constructor(
    orderRepo: IGenericRepository<IOrder>,
    courseRepo: IGenericRepository<ICourse>,
    learningPathRepo: IGenericRepository<ILearningPath>,
  ) {
    this._orderRepo = orderRepo;
    this._courseRepo = courseRepo;
    this._learningPathRepo = learningPathRepo;
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

  async getTopSellingLearningPaths(
    instructorId: Types.ObjectId,
  ): Promise<ITopSellingLearningPath[]> {
    return this._orderRepo.aggregate<ITopSellingLearningPath>([
      { $match: { status: "SUCCESS" } },
      { $unwind: "$learningPaths" },
      {
        $lookup: {
          from: "learningpaths",
          localField: "learningPaths.learningPathId",
          foreignField: "_id",
          as: "learningPathInfo",
        },
      },
      {
        $unwind: {
          path: "$learningPathInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { "learningPathInfo.instructorId": instructorId } },
      {
        $group: {
          _id: "$learningPaths.learningPathId",
          learningPathName: { $first: "$learningPaths.learningPathName" },
          thumbnailUrl: { $first: "$learningPaths.thumbnailUrl" },
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
    const courseSales = await this._orderRepo.aggregate<ICategorySales>([
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
    ]);

    const learningPathSales = await this._orderRepo.aggregate<ICategorySales>([
      { $match: { status: "SUCCESS" } },
      { $unwind: "$learningPaths" },
      {
        $lookup: {
          from: "learningpaths",
          localField: "learningPaths.learningPathId",
          foreignField: "_id",
          as: "learningPathInfo",
        },
      },
      {
        $unwind: {
          path: "$learningPathInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { "learningPathInfo.instructorId": instructorId } },
      {
        $group: {
          _id: "$learningPathInfo.category",
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
    ]);

    const combinedSales = [...courseSales, ...learningPathSales].reduce(
      (acc: ICategorySales[], curr: ICategorySales) => {
        const existing = acc.find(
          (item) => item.categoryName === curr.categoryName,
        );
        if (existing) {
          existing.totalSales += curr.totalSales;
        } else {
          acc.push(curr);
        }
        return acc;
      },
      [],
    );

    return combinedSales.sort((a, b) => b.totalSales - a.totalSales);
  }

  async getMonthlySalesGraph(
    instructorId: Types.ObjectId,
  ): Promise<IMonthlySales[]> {
    const courseSales = await this._orderRepo.aggregate<IMonthlySales>([
      { $match: { status: "SUCCESS" } },
      {
        $addFields: {
          totalStandaloneCourses: { $size: { $ifNull: ["$courses", []] } },
          totalLPCourses: {
            $sum: {
              $map: {
                input: { $ifNull: ["$learningPaths", []] },
                as: "lp",
                in: { $size: { $ifNull: ["$$lp.courses", []] } },
              },
            },
          },
          couponDiscount: {
            $toDouble: { $ifNull: ["$coupon.discountAmount", 0] },
          },
        },
      },
      {
        $addFields: {
          totalItems: {
            $toDouble: { $add: ["$totalStandaloneCourses", "$totalLPCourses"] },
          },
        },
      },
      {
        $addFields: {
          perItemDiscount: {
            $round: [
              {
                $cond: {
                  if: { $gt: ["$totalItems", 0] },
                  then: { $divide: ["$couponDiscount", "$totalItems"] },
                  else: 0,
                },
              },
              2,
            ],
          },
        },
      },
      { $unwind: "$courses" },
      { $match: { "courses.instructorId": instructorId } },
      {
        $addFields: {
          effectiveCoursePrice: {
            $round: [
              {
                $subtract: [
                  { $ifNull: ["$courses.offerPrice", "$courses.coursePrice"] },
                  "$perItemDiscount",
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
          courseSales: { $sum: 1 },
        },
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          totalRevenue: { $round: ["$totalRevenue", 2] },
          courseSales: 1,
          _id: 0,
        },
      },
    ]);

    const learningPathSales = await this._orderRepo.aggregate<IMonthlySales>([
      { $match: { status: "SUCCESS" } },
      {
        $addFields: {
          totalStandaloneCourses: { $size: { $ifNull: ["$courses", []] } },
          totalLPCourses: {
            $sum: {
              $map: {
                input: { $ifNull: ["$learningPaths", []] },
                as: "lp",
                in: { $size: { $ifNull: ["$$lp.courses", []] } },
              },
            },
          },
          couponDiscount: {
            $toDouble: { $ifNull: ["$coupon.discountAmount", 0] },
          },
        },
      },
      {
        $addFields: {
          totalItems: {
            $toDouble: { $add: ["$totalStandaloneCourses", "$totalLPCourses"] },
          },
        },
      },
      {
        $addFields: {
          perItemDiscount: {
            $round: [
              {
                $cond: {
                  if: { $gt: ["$totalItems", 0] },
                  then: { $divide: ["$couponDiscount", "$totalItems"] },
                  else: 0,
                },
              },
              2,
            ],
          },
        },
      },
      { $unwind: "$learningPaths" },
      {
        $lookup: {
          from: "learningpaths",
          localField: "learningPaths.learningPathId",
          foreignField: "_id",
          as: "learningPathInfo",
        },
      },
      {
        $unwind: {
          path: "$learningPathInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { "learningPathInfo.instructorId": instructorId } },
      {
        $addFields: {
          coursesInLearningPath: {
            $size: { $ifNull: ["$learningPaths.courses", []] },
          },
          instructorCourseCount: {
            $size: {
              $filter: {
                input: { $ifNull: ["$learningPaths.courses", []] },
                as: "course",
                cond: { $eq: ["$$course.instructorId", instructorId] },
              },
            },
          },
          effectiveCoursePrices: {
            $map: {
              input: { $ifNull: ["$learningPaths.courses", []] },
              as: "course",
              in: {
                courseId: "$$course.courseId",
                price: {
                  $ifNull: ["$$course.offerPrice", "$$course.coursePrice"],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          effectiveLearningPathPrice: {
            $round: [
              {
                $sum: {
                  $map: {
                    input: "$effectiveCoursePrices",
                    as: "course",
                    in: "$$course.price",
                  },
                },
              },
              2,
            ],
          },
          instructorContributionRatio: {
            $cond: {
              if: { $gt: ["$coursesInLearningPath", 0] },
              then: {
                $divide: ["$instructorCourseCount", "$coursesInLearningPath"],
              },
              else: 0,
            },
          },
          lpDiscount: {
            $round: [
              { $multiply: ["$perItemDiscount", "$coursesInLearningPath"] },
              2,
            ],
          },
        },
      },
      {
        $addFields: {
          effectiveLearningPathPrice: {
            $round: [
              { $subtract: ["$effectiveLearningPathPrice", "$lpDiscount"] },
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
              $round: [
                {
                  $multiply: [
                    "$effectiveLearningPathPrice",
                    "$instructorContributionRatio",
                    0.9,
                  ],
                },
                2,
              ],
            },
          },
          learningPathSales: { $sum: 1 },
        },
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          totalRevenue: { $round: ["$totalRevenue", 2] },
          learningPathSales: 1,
          _id: 0,
        },
      },
    ]);

    const combinedSales = courseSales.reduce(
      (acc: IMonthlySales[], courseItem: IMonthlySales) => {
        const key = `${courseItem.year}-${courseItem.month}`;
        const learningPathItem = learningPathSales.find(
          (lp) => `${lp.year}-${lp.month}` === key,
        );

        acc.push({
          year: courseItem.year,
          month: courseItem.month,
          totalRevenue: Number(
            (
              courseItem.totalRevenue + (learningPathItem?.totalRevenue || 0)
            ).toFixed(2),
          ),
          totalSales:
            courseItem.courseSales + (learningPathItem?.learningPathSales || 0),
          courseSales: courseItem.courseSales,
          learningPathSales: learningPathItem?.learningPathSales || 0,
        });

        return acc;
      },
      [],
    );

    learningPathSales.forEach((lpItem) => {
      const key = `${lpItem.year}-${lpItem.month}`;
      if (!combinedSales.some((item) => `${item.year}-${item.month}` === key)) {
        combinedSales.push({
          year: lpItem.year,
          month: lpItem.month,
          totalRevenue: Number(lpItem.totalRevenue.toFixed(2)),
          totalSales: lpItem.learningPathSales,
          courseSales: 0,
          learningPathSales: lpItem.learningPathSales,
        });
      }
    });

    return combinedSales.sort((a, b) => a.year - b.year || a.month - b.month);
  }

  async getTotalRevenue(instructorId: Types.ObjectId): Promise<number> {
    const courseRevenue = await this._orderRepo.aggregate<{
      total: number;
      debug: any[];
    }>([
      { $match: { status: "SUCCESS" } },
      {
        $addFields: {
          totalStandaloneCourses: { $size: { $ifNull: ["$courses", []] } },
          totalLPCourses: {
            $sum: {
              $map: {
                input: { $ifNull: ["$learningPaths", []] },
                as: "lp",
                in: { $size: { $ifNull: ["$$lp.courses", []] } },
              },
            },
          },
          couponDiscount: {
            $toDouble: { $ifNull: ["$coupon.discountAmount", 0] },
          },
        },
      },
      {
        $addFields: {
          totalItems: {
            $toDouble: { $add: ["$totalStandaloneCourses", "$totalLPCourses"] },
          },
        },
      },
      {
        $addFields: {
          perItemDiscount: {
            $round: [
              {
                $cond: {
                  if: { $gt: ["$totalItems", 0] },
                  then: { $divide: ["$couponDiscount", "$totalItems"] },
                  else: 0,
                },
              },
              2,
            ],
          },
        },
      },
      { $unwind: "$courses" },
      { $match: { "courses.instructorId": instructorId } },
      {
        $addFields: {
          effectiveCoursePrice: {
            $round: [
              {
                $subtract: [
                  { $ifNull: ["$courses.offerPrice", "$courses.coursePrice"] },
                  "$perItemDiscount",
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
          debug: {
            $push: {
              courseId: "$courses.courseId",
              offerPrice: "$courses.offerPrice",
              coursePrice: "$courses.coursePrice",
              perItemDiscount: "$perItemDiscount",
              effectiveCoursePrice: "$effectiveCoursePrice",
              couponDiscount: "$couponDiscount",
              totalStandaloneCourses: "$totalStandaloneCourses",
              totalLPCourses: "$totalLPCourses",
              totalItems: "$totalItems",
            },
          },
        },
      },
    ]);

    const learningPathRevenue = await this._orderRepo.aggregate<{
      total: number;
      debug: any[];
    }>([
      { $match: { status: "SUCCESS" } },
      {
        $addFields: {
          totalStandaloneCourses: { $size: { $ifNull: ["$courses", []] } },
          totalLPCourses: {
            $sum: {
              $map: {
                input: { $ifNull: ["$learningPaths", []] },
                as: "lp",
                in: { $size: { $ifNull: ["$$lp.courses", []] } },
              },
            },
          },
          couponDiscount: {
            $toDouble: { $ifNull: ["$coupon.discountAmount", 0] },
          },
        },
      },
      {
        $addFields: {
          totalItems: {
            $toDouble: { $add: ["$totalStandaloneCourses", "$totalLPCourses"] },
          },
        },
      },
      {
        $addFields: {
          perItemDiscount: {
            $round: [
              {
                $cond: {
                  if: { $gt: ["$totalItems", 0] },
                  then: { $divide: ["$couponDiscount", "$totalItems"] },
                  else: 0,
                },
              },
              2,
            ],
          },
        },
      },
      { $unwind: "$learningPaths" },
      {
        $lookup: {
          from: "learningpaths",
          localField: "learningPaths.learningPathId",
          foreignField: "_id",
          as: "learningPathInfo",
        },
      },
      {
        $unwind: {
          path: "$learningPathInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { "learningPathInfo.instructorId": instructorId } },
      {
        $addFields: {
          coursesInLearningPath: {
            $size: { $ifNull: ["$learningPaths.courses", []] },
          },
          instructorCourseCount: {
            $size: {
              $filter: {
                input: { $ifNull: ["$learningPaths.courses", []] },
                as: "course",
                cond: { $eq: ["$$course.instructorId", instructorId] },
              },
            },
          },
          effectiveCoursePrices: {
            $map: {
              input: { $ifNull: ["$learningPaths.courses", []] },
              as: "course",
              in: {
                courseId: "$$course.courseId",
                price: {
                  $ifNull: ["$$course.offerPrice", "$$course.coursePrice"],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          effectiveLearningPathPrice: {
            $round: [
              {
                $sum: {
                  $map: {
                    input: "$effectiveCoursePrices",
                    as: "course",
                    in: "$$course.price",
                  },
                },
              },
              2,
            ],
          },
          instructorContributionRatio: {
            $cond: {
              if: { $gt: ["$coursesInLearningPath", 0] },
              then: {
                $divide: ["$instructorCourseCount", "$coursesInLearningPath"],
              },
              else: 0,
            },
          },
          lpDiscount: {
            $round: [
              { $multiply: ["$perItemDiscount", "$coursesInLearningPath"] },
              2,
            ],
          },
        },
      },
      {
        $addFields: {
          effectiveLearningPathPrice: {
            $round: [
              { $subtract: ["$effectiveLearningPathPrice", "$lpDiscount"] },
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
              $round: [
                {
                  $multiply: [
                    "$effectiveLearningPathPrice",
                    "$instructorContributionRatio",
                    0.9,
                  ],
                },
                2,
              ],
            },
          },
          debug: {
            $push: {
              learningPathId: "$learningPaths.learningPathId",
              effectiveLearningPathPrice: "$effectiveLearningPathPrice",
              instructorContributionRatio: "$instructorContributionRatio",
              lpDiscount: "$lpDiscount",
              coursePrices: "$effectiveCoursePrices",
              perItemDiscount: "$perItemDiscount",
              coursesInLearningPath: "$coursesInLearningPath",
              couponDiscount: "$couponDiscount",
              totalStandaloneCourses: "$totalStandaloneCourses",
              totalLPCourses: "$totalLPCourses",
              totalItems: "$totalItems",
            },
          },
        },
      },
    ]);

    return Number(
      (
        (courseRevenue[0]?.total || 0) + (learningPathRevenue[0]?.total || 0)
      ).toFixed(2),
    );
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

  async getTotalLearningPathSales(
    instructorId: Types.ObjectId,
  ): Promise<number> {
    const result = await this._orderRepo.aggregate<{ totalSales: number }>([
      { $match: { status: "SUCCESS" } },
      { $unwind: "$learningPaths" },
      {
        $lookup: {
          from: "learningpaths",
          localField: "learningPaths.learningPathId",
          foreignField: "_id",
          as: "learningPathInfo",
        },
      },
      {
        $unwind: {
          path: "$learningPathInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { "learningPathInfo.instructorId": instructorId } },
      { $count: "totalSales" },
    ]);
    return result[0]?.totalSales || 0;
  }

  async getPublishedCoursesCount(
    instructorId: Types.ObjectId,
  ): Promise<number> {
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

  async getPublishedLearningPathsCount(
    instructorId: Types.ObjectId,
  ): Promise<number> {
    const result = await this._learningPathRepo.aggregate<{ total: number }>([
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
    const courseCategories = await this._courseRepo.aggregate<{
      uniqueCategories: Types.ObjectId[];
    }>([
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
    ]);

    const learningPathCategories = await this._learningPathRepo.aggregate<{
      uniqueCategories: Types.ObjectId[];
    }>([
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
    ]);

    const uniqueCategories = new Set([
      ...(courseCategories[0]?.uniqueCategories || []),
      ...(learningPathCategories[0]?.uniqueCategories || []),
    ]);

    return uniqueCategories.size;
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
      $or: [
        { "courses.instructorId": instructorId },
        { "learningPaths.courses.instructorId": instructorId },
      ],
    };

    const dataAggregation = await this._orderRepo.aggregate<IRevenueReportItem>(
      [
        { $match: matchStage },
        {
          $addFields: {
            totalStandaloneCourses: { $size: { $ifNull: ["$courses", []] } },
            totalLPCourses: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$learningPaths", []] },
                  as: "lp",
                  in: { $size: { $ifNull: ["$$lp.courses", []] } },
                },
              },
            },
            couponDiscountAmount: {
              $toDouble: { $ifNull: ["$coupon.discountAmount", 0] },
            },
          },
        },
        {
          $addFields: {
            totalItems: {
              $add: ["$totalStandaloneCourses", "$totalLPCourses"],
            },
          },
        },
        {
          $addFields: {
            perItemDiscount: {
              $round: [
                {
                  $cond: {
                    if: { $gt: ["$totalItems", 0] },
                    then: { $divide: ["$couponDiscountAmount", "$totalItems"] },
                    else: 0,
                  },
                },
                2,
              ],
            },
          },
        },
        {
          $project: {
            orderId: "$_id",
            date: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$createdAt",
              },
            },
            totalOrderAmount: "$amount",
            couponCode: { $ifNull: ["$coupon.couponName", "N/A"] },
            couponDiscount: { $ifNull: ["$coupon.discountPercentage", 0] },
            couponDiscountAmount: 1,
            standaloneCourse: {
              $map: {
                input: {
                  $filter: {
                    input: "$courses",
                    as: "course",
                    cond: { $eq: ["$$course.instructorId", instructorId] },
                  },
                },
                as: "course",
                in: {
                  courseName: "$$course.courseName",
                  standAloneCourseTotalPrice: {
                    $round: [
                      {
                        $subtract: [
                          {
                            $ifNull: [
                              "$$course.offerPrice",
                              "$$course.coursePrice",
                            ],
                          },
                          "$perItemDiscount",
                        ],
                      },
                      2,
                    ],
                  },
                },
              },
            },
            learningPath: {
              $map: {
                input: {
                  $filter: {
                    input: "$learningPaths",
                    as: "lp",
                    cond: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$$lp.courses",
                              as: "course",
                              cond: {
                                $eq: ["$$course.instructorId", instructorId],
                              },
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                as: "lp",
                in: {
                  learningPathName: "$$lp.learningPathName",
                  learningPathTotalPrice: {
                    $round: [
                      {
                        $subtract: [
                          "$$lp.totalPrice",
                          {
                            $multiply: [
                              "$perItemDiscount",
                              { $size: "$$lp.courses" },
                            ],
                          },
                        ],
                      },
                      2,
                    ],
                  },
                },
              },
            },
            instructorRevenue: {
              $round: [
                {
                  $add: [
                    {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: "$courses",
                              as: "course",
                              cond: {
                                $eq: ["$$course.instructorId", instructorId],
                              },
                            },
                          },
                          as: "course",
                          in: {
                            $multiply: [
                              {
                                $subtract: [
                                  {
                                    $ifNull: [
                                      "$$course.offerPrice",
                                      "$$course.coursePrice",
                                    ],
                                  },
                                  "$perItemDiscount",
                                ],
                              },
                              0.9,
                            ],
                          },
                        },
                      },
                    },
                    {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: "$learningPaths",
                              as: "lp",
                              cond: {
                                $gt: [
                                  {
                                    $size: {
                                      $filter: {
                                        input: "$$lp.courses",
                                        as: "course",
                                        cond: {
                                          $eq: [
                                            "$$course.instructorId",
                                            instructorId,
                                          ],
                                        },
                                      },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                          },
                          as: "lp",
                          in: {
                            $multiply: [
                              {
                                $subtract: [
                                  "$$lp.totalPrice",
                                  {
                                    $multiply: [
                                      "$perItemDiscount",
                                      { $size: "$$lp.courses" },
                                    ],
                                  },
                                ],
                              },
                              {
                                $divide: [
                                  {
                                    $size: {
                                      $filter: {
                                        input: "$$lp.courses",
                                        as: "course",
                                        cond: {
                                          $eq: [
                                            "$$course.instructorId",
                                            instructorId,
                                          ],
                                        },
                                      },
                                    },
                                  },
                                  { $size: "$$lp.courses" },
                                ],
                              },
                              0.9,
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
                2,
              ],
            },
          },
        },
        { $sort: { date: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ],
    );

    const countAggregation = await this._orderRepo.aggregate<{ total: number }>(
      [
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: 1 } } },
        { $project: { total: 1, _id: 0 } },
      ],
    );

    const total = countAggregation[0]?.total || 0;

    return { data: dataAggregation, total };
  }
}
