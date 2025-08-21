import { Types } from "mongoose";
import { IInstructorCourseSpecificDashboardRepository } from "./interface/IInstructorSpecificCourseDashboardRepository";
import { IPaymentRepository } from "../interfaces/IPaymentRepository";
import { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository";
import { ICourseRepository } from "../interfaces/ICourseRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { INSTRUCTOR_REVENUE_SHARE } from "../../utils/constants";

export class InstructorSpecificCourseDashboardRepository
  implements IInstructorCourseSpecificDashboardRepository
{
  private _paymentRepo: IPaymentRepository;
  private _enrollmentRepo: IEnrollmentRepository;
  private _courseRepo: ICourseRepository;
  private _orderRepo: IOrderRepository;
  constructor(
    paymentRepo: IPaymentRepository,
    enrollmentRepo: IEnrollmentRepository,
    courseRepo: ICourseRepository,
    orderRepo: IOrderRepository
  ) {
    this._paymentRepo = paymentRepo;
    this._enrollmentRepo = enrollmentRepo;
    this._courseRepo = courseRepo;
    this._orderRepo = orderRepo;
  }

  async getCourseRevenue(courseId: Types.ObjectId): Promise<number> {
    const payments = await this._paymentRepo.findAll({ status: "SUCCESS" });
    let totalRevenue = 0;

    for (const payment of payments || []) {
      const order = await this._orderRepo.findById(
        (payment.orderId as Types.ObjectId).toString()
      );
      if (!order || !order.courses.includes(courseId)) continue;

      const course = await this._courseRepo.findById(courseId.toString());
      if (!course) continue;

      totalRevenue += course.price * INSTRUCTOR_REVENUE_SHARE;
    }

    return totalRevenue;
  }

  async getCourseEnrollmentCount(courseId: Types.ObjectId): Promise<number> {
    const enrollments = await this._enrollmentRepo.findAll({ courseId });
    return enrollments?.length || 0;
  }

  async getCourseCategory(courseId: Types.ObjectId): Promise<string | null> {
    const course = await this._courseRepo.findByIdWithPopulate(
      courseId.toString(),
      {
        path: "category",
        select: "categoryName",
      }
    );

    return course?.category && "categoryName" in course.category
      ? (course.category as { categoryName: string }).categoryName
      : null;
  }

  async getMonthlyPerformance(
    courseId: Types.ObjectId
  ): Promise<{ month: number; year: number; totalSales: number }[]> {
    const payments = await this._paymentRepo.findAll({ status: "SUCCESS" });
    const monthlyMap = new Map<string, number>();

    for (const payment of payments || []) {
      const order = await this._orderRepo.findById(
        (payment.orderId as Types.ObjectId).toString()
      );
      if (!order || !order.courses.includes(courseId)) continue;

      const course = await this._courseRepo.findById(courseId.toString());
      if (!course) continue;

      const date = payment.createdAt;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyMap.set(
        key,
        (monthlyMap.get(key) || 0) + course.price * INSTRUCTOR_REVENUE_SHARE
      );
    }

    return Array.from(monthlyMap.entries()).map(([key, totalSales]) => {
      const [year, month] = key.split("-").map(Number);
      return { month, year, totalSales };
    });
  }

  async getCoursePrice(courseId: Types.ObjectId): Promise<number> {
    const course = await this._courseRepo.findById(courseId.toString());
    return course?.price || 0;
  }

  async getCourseRevenueReport(
    courseId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    data: {
      orderId: string;
      courseName: string;
      purchaseDate: Date;
      coursePrice: number;
      instructorRevenue: number;
      totalEnrollments: number;
    }[];
    total: number;
  }> {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (range) {
      case "daily":
        start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0
        );
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      case "weekly":
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        break;
      case "yearly":
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case "custom":
        if (!startDate || !endDate) {
          throw new Error("Start and end date are required for custom range");
        }
        if (startDate > endDate) {
          throw new Error("Start date must be before end date");
        }
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        throw new Error("Invalid range");
    }

    // Use aggregation to get precise total count of payments with matching courseId
    const totalPipeline = [
      { $match: { status: "SUCCESS", createdAt: { $gte: start, $lte: end } } },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      { $match: { "order.courses": courseId } },
      { $count: "total" },
    ];

    const totalResult = await this._paymentRepo.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Get paginated payments
    const { data: payments } = await this._paymentRepo.paginate(
      {
        status: "SUCCESS",
        createdAt: { $gte: start, $lte: end },
      },
      page,
      limit,
      { createdAt: -1 }
    );

    const enrollments = await this.getCourseEnrollmentCount(courseId);

    const results = [];

    for (const payment of payments || []) {
      const order = await this._orderRepo.findById(
        (payment.orderId as Types.ObjectId).toString()
      );
      if (!order || !order.courses.includes(courseId)) continue;

      const course = await this._courseRepo.findById(courseId.toString());
      if (!course) continue;

      results.push({
        orderId: order._id.toString(),
        courseName: course.courseName,
        purchaseDate: payment.createdAt,
        coursePrice: course.price,
        instructorRevenue: course.price * INSTRUCTOR_REVENUE_SHARE,
        totalEnrollments: enrollments,
      });
    }

    console.log("specific dashboard report", results);

    return {
      data: results,
      total,
    };
  }
}
