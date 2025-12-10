import { Types, PipelineStage } from "mongoose";
import { IInstructorAllCourseDashboardRepository } from "./interface/IInstructorAllCourseDashboardRepository";
import { IGenericRepository } from "../genericRepository";
import { IOrder } from "../../models/orderModel";
import { ILearningPath } from "../../models/learningPathModel";
import { ICourse } from "../../models/courseModel";
import {
  ITopSellingCourse,
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

  /* -------------------------------------------------
   *  Helper: split coupon discount proportionally
   * ------------------------------------------------- */
  private couponSplitPipeline(): PipelineStage[] {
    return [
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
          couponDiscount: { $toDouble: { $ifNull: ["$coupon.discountAmount", 0] } },
        },
      },
      {
        $addFields: {
          totalItems: { $add: ["$totalStandaloneCourses", "$totalLPCourses"] },
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
    ];
  }

  /* -------------------------------------------------
   *  Top selling courses
   * ------------------------------------------------- */
  async getTopSellingCourses(
    instructorId: Types.ObjectId,
  ): Promise<ITopSellingCourse[]> {
    const pipeline: PipelineStage[] = [
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
    ];

    return this._orderRepo.aggregate<ITopSellingCourse>(pipeline);
  }

  /* -------------------------------------------------
   *  Category-wise sales
   * ------------------------------------------------- */
  async getCategoryWiseSales(
    instructorId: Types.ObjectId,
  ): Promise<ICategorySales[]> {
    const courseSalesPipeline: PipelineStage[] = [
      { $match: { status: "SUCCESS" } },
      { $unwind: "$courses" },
      { $match: { "courses.instructorId": instructorId } },
      {
        $lookup: {
          from: "courses",
          localField: "courses.courseId",
          foreignField: "_id",
          as: "c",
        },
      },
      { $unwind: "$c" },
      {
        $group: {
          _id: "$c.category",
          totalSales: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      {
        $project: {
          categoryName: { $arrayElemAt: ["$cat.categoryName", 0] },
          totalSales: 1,
          _id: 0,
        },
      },
    ];

    const lpCourseSalesPipeline: PipelineStage[] = [
      { $match: { status: "SUCCESS" } },
      { $unwind: "$learningPaths" },
      { $unwind: "$learningPaths.courses" },
      { $match: { "learningPaths.courses.instructorId": instructorId } },
      {
        $lookup: {
          from: "courses",
          localField: "learningPaths.courses.courseId",
          foreignField: "_id",
          as: "c",
        },
      },
      { $unwind: "$c" },
      {
        $group: {
          _id: "$c.category",
          totalSales: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      {
        $project: {
          categoryName: { $arrayElemAt: ["$cat.categoryName", 0] },
          totalSales: 1,
          _id: 0,
        },
      },
    ];

    const [courseSales, lpCourseSales] = await Promise.all([
      this._orderRepo.aggregate<ICategorySales>(courseSalesPipeline),
      this._orderRepo.aggregate<ICategorySales>(lpCourseSalesPipeline),
    ]);

    const combined = [...courseSales, ...lpCourseSales].reduce(
      (acc: ICategorySales[], cur) => {
        const found = acc.find((i) => i.categoryName === cur.categoryName);
        if (found) found.totalSales += cur.totalSales;
        else acc.push(cur);
        return acc;
      },
      [],
    );

    return combined.sort((a, b) => b.totalSales - a.totalSales);
  }

  /* -------------------------------------------------
   *  Monthly sales graph
   * ------------------------------------------------- */
  async getMonthlySalesGraph(
    instructorId: Types.ObjectId,
  ): Promise<IMonthlySales[]> {
    const pipeline: PipelineStage[] = [
      ...this.couponSplitPipeline(),
      { $match: { status: "SUCCESS" } },

      {
        $facet: {
          standalone: [
            { $unwind: "$courses" },
            { $match: { "courses.instructorId": instructorId } },
            {
              $addFields: {
                effectivePrice: {
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
                revenue: {
                  $sum: { $round: [{ $multiply: ["$effectivePrice", 0.9] }, 2] },
                },
                sales: { $sum: 1 },
              },
            },
          ],

          lpCourses: [
            { $unwind: "$learningPaths" },
            { $unwind: "$learningPaths.courses" },
            { $match: { "learningPaths.courses.instructorId": instructorId } },
            {
              $addFields: {
                effectivePrice: {
                  $round: [
                    {
                      $subtract: [
                        {
                          $ifNull: [
                            "$learningPaths.courses.offerPrice",
                            "$learningPaths.courses.coursePrice",
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
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                revenue: {
                  $sum: { $round: [{ $multiply: ["$effectivePrice", 0.9] }, 2] },
                },
                sales: { $sum: 1 },
              },
            },
          ],
        },
      },

      {
        $project: {
          combined: {
            $concatArrays: [
              {
                $map: {
                  input: "$standalone",
                  as: "s",
                  in: {
                    year: "$$s._id.year",
                    month: "$$s._id.month",
                    revenue: "$$s.revenue",
                    sales: "$$s.sales",
                  },
                },
              },
              {
                $map: {
                  input: "$lpCourses",
                  as: "lp",
                  in: {
                    year: "$$lp._id.year",
                    month: "$$lp._id.month",
                    revenue: "$$lp.revenue",
                    sales: "$$lp.sales",
                  },
                },
              },
            ],
          },
        },
      },
      { $unwind: "$combined" },
      {
        $group: {
          _id: { year: "$combined.year", month: "$combined.month" },
          totalRevenue: { $sum: "$combined.revenue" },
          totalSales: { $sum: "$combined.sales" },
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
    ];

    return this._orderRepo.aggregate<IMonthlySales>(pipeline);
  }

  /* -------------------------------------------------
   *  Total revenue
   * ------------------------------------------------- */
  async getTotalRevenue(instructorId: Types.ObjectId): Promise<number> {
    const pipeline: PipelineStage[] = [
      ...this.couponSplitPipeline(),
      { $match: { status: "SUCCESS" } },

      {
        $facet: {
          standalone: [
            { $unwind: "$courses" },
            { $match: { "courses.instructorId": instructorId } },
            {
              $addFields: {
                effective: {
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
                rev: { $sum: { $round: [{ $multiply: ["$effective", 0.9] }, 2] } },
              },
            },
          ],

          lpCourses: [
            { $unwind: "$learningPaths" },
            { $unwind: "$learningPaths.courses" },
            { $match: { "learningPaths.courses.instructorId": instructorId } },
            {
              $addFields: {
                effective: {
                  $round: [
                    {
                      $subtract: [
                        {
                          $ifNull: [
                            "$learningPaths.courses.offerPrice",
                            "$learningPaths.courses.coursePrice",
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
            {
              $group: {
                _id: null,
                rev: { $sum: { $round: [{ $multiply: ["$effective", 0.9] }, 2] } },
              },
            },
          ],
        },
      },

      {
        $project: {
          total: {
            $round: [
              {
                $add: [
                  { $ifNull: [{ $arrayElemAt: ["$standalone.rev", 0] }, 0] },
                  { $ifNull: [{ $arrayElemAt: ["$lpCourses.rev", 0] }, 0] },
                ],
              },
              2,
            ],
          },
        },
      },
    ];

    const result = await this._orderRepo.aggregate<{ total: number }>(pipeline);
    return result[0]?.total || 0;
  }

  /* -------------------------------------------------
   *  Total course sales
   * ------------------------------------------------- */
  async getTotalCourseSales(instructorId: Types.ObjectId): Promise<number> {
    const pipeline: PipelineStage[] = [
      { $match: { status: "SUCCESS" } },
      {
        $facet: {
          standalone: [
            { $unwind: "$courses" },
            { $match: { "courses.instructorId": instructorId } },
            { $count: "cnt" },
          ],
          lp: [
            { $unwind: "$learningPaths" },
            { $unwind: "$learningPaths.courses" },
            { $match: { "learningPaths.courses.instructorId": instructorId } },
            { $count: "cnt" },
          ],
        },
      },
      {
        $project: {
          total: {
            $add: [
              { $ifNull: [{ $arrayElemAt: ["$standalone.cnt", 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ["$lp.cnt", 0] }, 0] },
            ],
          },
        },
      },
    ];
    const res = await this._orderRepo.aggregate<{ total: number }>(pipeline);
    return res[0]?.total || 0;
  }

  /* -------------------------------------------------
   *  Published counts
   * ------------------------------------------------- */
  async getPublishedCoursesCount(instructorId: Types.ObjectId): Promise<number> {
    const r = await this._courseRepo.aggregate<{ total: number }>([
      { $match: { instructorId, isPublished: true } },
      { $count: "total" },
    ]);
    return r[0]?.total || 0;
  }

  async getCategoryWiseCreatedCourses(instructorId: Types.ObjectId): Promise<number> {
    const c = await this._courseRepo.aggregate<{ cats: Types.ObjectId[] }>([
      { $match: { instructorId, isPublished: true } },
      { $group: { _id: null, cats: { $addToSet: "$category" } } },
    ]);
    const lp = await this._learningPathRepo.aggregate<{ cats: Types.ObjectId[] }>([
      { $match: { instructorId, isPublished: true } },
      { $group: { _id: null, cats: { $addToSet: "$category" } } },
    ]);
    const set = new Set([...(c[0]?.cats || []), ...(lp[0]?.cats || [])]);
    return set.size;
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
  const end = new Date();

  switch (range) {
    case "daily":
      start = new Date(); start.setHours(0, 0, 0, 0);
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
      if (!startDate || !endDate) throw new Error("custom range needs start/end");
      start = new Date(startDate);
      end.setTime(new Date(endDate).getTime());
      end.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error("invalid range");
  }

  const match = {
    status: "SUCCESS",
    createdAt: { $gte: start, $lte: end },
  };

  const pipeline: PipelineStage[] = [
    { $match: match },
    ...this.couponSplitPipeline(),
    {
      $facet: {
        standaloneCourses: [
          { $unwind: "$courses" },
          { $match: { "courses.instructorId": instructorId } },
          {
            $project: {
              orderId: "$_id",
              date: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
              totalOrderAmount: "$amount",
              // <-- changed here
              couponCode: {
                $cond: {
                  if: { $ifNull: ["$coupon.couponName", false] },
                  then: "$coupon.couponName",
                  else: "No",
                },
              },
              couponDiscount: { $ifNull: ["$coupon.discountPercentage", 0] },
              couponDiscountAmount: "$coupon.discountAmount",
              courseName: "$courses.courseName",
              price: {
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
        ],

        lpCourses: [
          { $unwind: "$learningPaths" },
          { $unwind: "$learningPaths.courses" },
          { $match: { "learningPaths.courses.instructorId": instructorId } },
          {
            $project: {
              orderId: "$_id",
              date: { $dateToString: { format: "%d-%m-%Y", date: "$createdAt" } },
              totalOrderAmount: "$amount",
              // <-- changed here (same logic)
              couponCode: {
                $cond: {
                  if: { $ifNull: ["$coupon.couponName", false] },
                  then: "$coupon.couponName",
                  else: "No",
                },
              },
              couponDiscount: { $ifNull: ["$coupon.discountPercentage", 0] },
              couponDiscountAmount: "$coupon.discountAmount",
              courseName: "$learningPaths.courses.courseName",
              price: {
                $round: [
                  {
                    $subtract: [
                      {
                        $ifNull: [
                          "$learningPaths.courses.offerPrice",
                          "$learningPaths.courses.coursePrice",
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
        ],
      },
    },

    // === COMBINE ALL INSTRUCTOR COURSES ===
    {
      $project: {
        allCourses: { $concatArrays: ["$standaloneCourses", "$lpCourses"] },
      },
    },
    { $unwind: "$allCourses" },

    // === GROUP BY ORDER ID ===
    {
      $group: {
        _id: "$allCourses.orderId",
        date: { $first: "$allCourses.date" },
        totalOrderAmount: { $first: "$allCourses.totalOrderAmount" },
        couponCode: { $first: "$allCourses.couponCode" },
        couponDiscount: { $first: "$allCourses.couponDiscount" },
        couponDiscountAmount: { $first: "$allCourses.couponDiscountAmount" },
        courses: {
          $push: {
            courseName: "$allCourses.courseName",
            price: "$allCourses.price",
          },
        },
        instructorRevenue: {
          $sum: { $round: [{ $multiply: ["$allCourses.price", 0.9] }, 2] },
        },
      },
    },

    // === FINAL SHAPE ===
    {
      $project: {
        _id: 0,
        orderId: "$_id",
        date: 1,
        totalOrderAmount: 1,
        couponCode: 1,
        couponDiscount: 1,
        couponDiscountAmount: 1,
        instructorRevenue: { $round: ["$instructorRevenue", 2] },
        courses: 1,
      },
    },

    { $sort: { date: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  const countPipeline: PipelineStage[] = [
    { $match: match },
    {
      $facet: {
        standalone: [
          { $unwind: "$courses" },
          { $match: { "courses.instructorId": instructorId } },
          { $count: "count" },
        ],
        lp: [
          { $unwind: "$learningPaths" },
          { $unwind: "$learningPaths.courses" },
          { $match: { "learningPaths.courses.instructorId": instructorId } },
          { $count: "count" },
        ],
      },
    },
    {
      $project: {
        total: {
          $add: [
            { $ifNull: [{ $arrayElemAt: ["$standalone.count", 0] }, 0] },
            { $ifNull: [{ $arrayElemAt: ["$lp.count", 0] }, 0] },
          ],
        },
      },
    },
  ];

  const [data, totalResult] = await Promise.all([
    this._orderRepo.aggregate<IRevenueReportItem>(pipeline),
    this._orderRepo.aggregate<{ total: number }>(countPipeline),
  ]);

  return {
    data,
    total: totalResult[0]?.total || 0,
  };
}

}