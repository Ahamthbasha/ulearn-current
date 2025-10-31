import { IAdminDashboardRepository } from "./interface/IAdminDashboardRepository";
import { CourseRepository } from "../CourseRepository";
import { OrderRepository } from "../OrderRepository";
import { InstructorMembershipOrder } from "../InstructorMemberShirpOrderRepository";
import IInstructorRepository from "../instructorRepository/interface/IInstructorRepository";
import { PipelineStage } from "mongoose";
import {
  IAdminCourseSalesReportItem,
  IAdminMembershipReportItem,
} from "../../types/dashboardTypes";
import {
  InstructorDocument,
  CourseDetails,
  ILearningPathOrderDetails,
  IOrder,
} from "../../interface/adminInterface/IadminInterface";
import { MembershipRevenueResult } from "../../types/adminTypes/adminTypes";

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
    const pipeline: PipelineStage[] = [
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ];
    const result = await this._membershipOrderRepo.aggregate<MembershipRevenueResult>(pipeline);
    return result[0]?.total || 0;
  }

  async getTotalCourseRevenue(): Promise<number> {
    const orders =
      (await this._orderRepo.findSuccessfulOrdersLean()) as IOrder[];
    let totalAdminShare = 0;

    for (const order of orders) {
      const totalNoOfCoursesInAnOrder =
        order.courses.length +
        order.learningPaths.reduce(
          (sum: number, lp: ILearningPathOrderDetails) =>
            sum + lp.courses.length,
          0,
        );

      const discountAmount = order.coupon?.discountAmount || 0;
      const perCourseDiscountAmount =
        totalNoOfCoursesInAnOrder > 0
          ? discountAmount / totalNoOfCoursesInAnOrder
          : 0;

      for (const course of order.courses) {
        const price =
          course.offerPrice != null ? course.offerPrice : course.coursePrice;
        const finalPrice = price - perCourseDiscountAmount;
        totalAdminShare += Number((finalPrice * 0.1).toFixed(2)); // Round each adminShare to two decimal places
      }

      for (const learningPath of order.learningPaths) {
        for (const course of learningPath.courses) {
          const price =
            course.offerPrice != null ? course.offerPrice : course.coursePrice;
          const finalPrice = price - perCourseDiscountAmount;
          totalAdminShare += Number((finalPrice * 0.1).toFixed(2)); // Round each adminShare to two decimal places
        }
      }
    }

    return Number(totalAdminShare.toFixed(2)); // Ensure final result is rounded to two decimal places
  }

  async getMonthlyCourseSales(): Promise<
    { month: number; year: number; total: number }[]
  > {
    const orders =
      (await this._orderRepo.findSuccessfulOrdersLean()) as IOrder[];
    const monthlyTotals: { [key: string]: number } = {};

    for (const order of orders) {
      const month = order.createdAt.getMonth() + 1;
      const year = order.createdAt.getFullYear();
      const key = `${year}-${month}`;

      const totalNoOfCoursesInAnOrder =
        order.courses.length +
        order.learningPaths.reduce(
          (sum: number, lp: ILearningPathOrderDetails) =>
            sum + lp.courses.length,
          0,
        );

      const discountAmount = order.coupon?.discountAmount || 0;
      const perCourseDiscountAmount =
        totalNoOfCoursesInAnOrder > 0
          ? discountAmount / totalNoOfCoursesInAnOrder
          : 0;

      let orderAdminShare = 0;

      for (const course of order.courses) {
        const price =
          course.offerPrice != null ? course.offerPrice : course.coursePrice;
        const finalPrice = price - perCourseDiscountAmount;
        orderAdminShare += Number((finalPrice * 0.1).toFixed(2)); // Round each adminShare
      }

      for (const learningPath of order.learningPaths) {
        for (const course of learningPath.courses) {
          const price =
            course.offerPrice != null ? course.offerPrice : course.coursePrice;
          const finalPrice = price - perCourseDiscountAmount;
          orderAdminShare += Number((finalPrice * 0.1).toFixed(2)); // Round each adminShare
        }
      }

      monthlyTotals[key] =
        (monthlyTotals[key] || 0) + Number(orderAdminShare.toFixed(2));
    }

    return Object.entries(monthlyTotals)
      .map(([key, total]) => {
        const [year, month] = key.split("-").map(Number);
        return { month, year, total: Number(total.toFixed(2)) };
      })
      .sort((a, b) =>
        a.year === b.year ? a.month - b.month : a.year - b.year,
      );
  }

  async getMonthlyMembershipSales(): Promise<
    { month: number; year: number; total: number }[]
  > {
    const pipeline: PipelineStage[] = [
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
    ];

    const result = await this._membershipOrderRepo.aggregate<{
      month: number;
      year: number;
      total: number;
    }>(pipeline);

    return result;
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
        start = new Date(
          Date.UTC(
            filter.startDate.getFullYear(),
            filter.startDate.getMonth(),
            filter.startDate.getDate(),
            0,
            0,
            0,
            0,
          ),
        );
        end = new Date(
          Date.UTC(
            filter.endDate.getFullYear(),
            filter.endDate.getMonth(),
            filter.endDate.getDate(),
            23,
            59,
            59,
            999,
          ),
        );
        break;
      default:
        throw new Error("Invalid filter type");
    }

    const query = {
      status: "SUCCESS",
      createdAt: { $gte: start, $lte: end },
    };

    const totalItems = await this._orderRepo.countDocumentsMatching(query);

    const aggregation: PipelineStage[] = [
      { $match: query },
      {
        $lookup: {
          from: "instructors",
          localField: "courses.instructorId",
          foreignField: "_id",
          as: "instructors",
        },
      },
      {
        $lookup: {
          from: "instructors",
          localField: "learningPaths.courses.instructorId",
          foreignField: "_id",
          as: "learningPathInstructors",
        },
      },
    ];

    if (page && limit) {
      aggregation.push({ $skip: (page - 1) * limit });
      aggregation.push({ $limit: limit });
    }

    const orders = await this._orderRepo.performAggregation<
      IOrder & {
        instructors: InstructorDocument[];
        learningPathInstructors: InstructorDocument[];
      }
    >(aggregation);

    const items: IAdminCourseSalesReportItem[] = [];

    for (const order of orders) {
      const totalNoOfCoursesInAnOrder =
        order.courses.length +
        order.learningPaths.reduce(
          (sum: number, lp: ILearningPathOrderDetails) =>
            sum + lp.courses.length,
          0,
        );

      const discountAmount = order.coupon?.discountAmount || 0;
      const perCourseDiscountAmount =
        totalNoOfCoursesInAnOrder > 0
          ? discountAmount / totalNoOfCoursesInAnOrder
          : 0;

      const courses: CourseDetails[] = [];

      for (const course of order.courses) {
        const instructor = order.instructors.find((inst) =>
          inst._id.equals(course.instructorId),
        );
        const price =
          course.offerPrice != null ? course.offerPrice : course.coursePrice;
        const discountedPrice = price - perCourseDiscountAmount;
        const adminShare = discountedPrice * 0.1;

        courses.push({
          courseName: course.courseName,
          instructorName: instructor?.username || "Unknown",
          coursePrice: course.coursePrice,
          offerPrice: course.offerPrice,
          discountedPrice: Number(discountedPrice.toFixed(2)),
          adminShare: Number(adminShare.toFixed(2)),
        });
      }

      for (const learningPath of order.learningPaths) {
        for (const course of learningPath.courses) {
          const instructor = order.learningPathInstructors.find((inst) =>
            inst._id.equals(course.instructorId),
          );
          const price =
            course.offerPrice != null ? course.offerPrice : course.coursePrice;
          const discountedPrice = price - perCourseDiscountAmount;
          const adminShare = discountedPrice * 0.1;

          courses.push({
            courseName: course.courseName,
            instructorName: instructor?.username || "Unknown",
            coursePrice: course.coursePrice,
            offerPrice: course.offerPrice,
            discountedPrice: Number(discountedPrice.toFixed(2)),
            adminShare: Number(adminShare.toFixed(2)),
          });
        }
      }

      const totalPrice = Number(order.amount.toFixed(2));
      const totalAdminShare = Number(
        courses.reduce(
          (sum, course) => sum + course.adminShare / 0.1, // Use unrounded adminShare equivalent
          0,
        ) * 0.1,
      ).toFixed(2);

      const date = new Date(order.createdAt);
      const formattedDate = `${date.getDate().toString().padStart(2, "0")}-${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${date.getFullYear()}`;

      items.push({
        orderId: order._id.toString(),
        date: formattedDate,
        couponCode: order.coupon?.couponName || "",
        totalPrice,
        discountAmount: Number(discountAmount.toFixed(2)),
        courses,
        totalAdminShare: Number(totalAdminShare),
      });
    }

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
        start = new Date(
          Date.UTC(
            filter.startDate.getFullYear(),
            filter.startDate.getMonth(),
            filter.startDate.getDate(),
            0,
            0,
            0,
            0,
          ),
        );
        end = new Date(
          Date.UTC(
            filter.endDate.getFullYear(),
            filter.endDate.getMonth(),
            filter.endDate.getDate(),
            23,
            59,
            59,
            999,
          ),
        );
        break;
      default:
        throw new Error("Invalid filter type");
    }

    const countPipeline: PipelineStage[] = [
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ];

    const countResult = await this._membershipOrderRepo.aggregate<{
      _id: null;
      count: number;
    }>(countPipeline);

    const totalItems = countResult[0]?.count || 0;

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
          date: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$createdAt",
            },
          },
          instructorName: "$instructorDetails.username",
          planName: "$planDetails.name",
          price: "$price",
        },
      },
    ];

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
    const pipeline: PipelineStage[] = [
      { $match: { status: "SUCCESS" } },
      {
        $facet: {
          standaloneCourses: [
            { $unwind: "$courses" },
            {
              $group: {
                _id: "$courses.courseId",
                courseName: { $first: "$courses.courseName" },
                salesCount: { $sum: 1 },
              },
            },
          ],
          learningPathCourses: [
            { $unwind: "$learningPaths" },
            { $unwind: "$learningPaths.courses" },
            {
              $group: {
                _id: "$learningPaths.courses.courseId",
                courseName: { $first: "$learningPaths.courses.courseName" },
                salesCount: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          allCourses: {
            $concatArrays: ["$standaloneCourses", "$learningPathCourses"],
          },
        },
      },
      { $unwind: "$allCourses" },
      {
        $group: {
          _id: "$allCourses._id",
          courseName: { $first: "$allCourses.courseName" },
          salesCount: { $sum: "$allCourses.salesCount" },
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
    ];

    return await this._orderRepo.performAggregation<{
      courseName: string;
      salesCount: number;
    }>(pipeline);
  }

  async getTopSellingCategories(
    limit = 3,
  ): Promise<{ categoryName: string; salesCount: number }[]> {
    const pipeline: PipelineStage[] = [
      { $match: { status: "SUCCESS" } },
      {
        $facet: {
          standaloneCourses: [
            { $unwind: "$courses" },
            {
              $lookup: {
                from: "courses",
                localField: "courses.courseId",
                foreignField: "_id",
                as: "courseDetails",
              },
            },
            { $unwind: "$courseDetails" },
            {
              $lookup: {
                from: "categories", // Join with Category collection
                localField: "courseDetails.category",
                foreignField: "_id",
                as: "categoryDetails",
              },
            },
            {
              $unwind: {
                path: "$categoryDetails",
                preserveNullAndEmptyArrays: true,
              },
            }, // Allow for missing categories
            {
              $group: {
                _id: "$courseDetails.category",
                categoryName: {
                  $first: {
                    $ifNull: ["$categoryDetails.categoryName", "Unknown"],
                  },
                }, // Use categoryName from Category collection
                salesCount: { $sum: 1 },
              },
            },
          ],
          learningPathCourses: [
            { $unwind: "$learningPaths" },
            { $unwind: "$learningPaths.courses" },
            {
              $lookup: {
                from: "courses",
                localField: "learningPaths.courses.courseId",
                foreignField: "_id",
                as: "courseDetails",
              },
            },
            { $unwind: "$courseDetails" },
            {
              $lookup: {
                from: "categories", // Join with Category collection
                localField: "courseDetails.category",
                foreignField: "_id",
                as: "categoryDetails",
              },
            },
            {
              $unwind: {
                path: "$categoryDetails",
                preserveNullAndEmptyArrays: true,
              },
            }, // Allow for missing categories
            {
              $group: {
                _id: "$courseDetails.category",
                categoryName: {
                  $first: {
                    $ifNull: ["$categoryDetails.categoryName", "Unknown"],
                  },
                }, // Use categoryName from Category collection
                salesCount: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          allCategories: {
            $concatArrays: ["$standaloneCourses", "$learningPathCourses"],
          },
        },
      },
      { $unwind: "$allCategories" },
      {
        $group: {
          _id: "$allCategories._id",
          categoryName: { $first: "$allCategories.categoryName" },
          salesCount: { $sum: "$allCategories.salesCount" },
        },
      },
      { $sort: { salesCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          categoryName: 1,
          salesCount: 1,
        },
      },
    ];

    return await this._orderRepo.performAggregation<{
      categoryName: string;
      salesCount: number;
    }>(pipeline);
  }
}
