import { IInstructorCourseSpecificDashboardRepository } from "./interface/IInstructorSpecificCourseDashboardRepository";
import { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository";
import { ICourseRepository } from "../interfaces/ICourseRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { INSTRUCTOR_REVENUE_SHARE } from "../../utils/constants";
import { Types } from "mongoose";

export class InstructorSpecificCourseDashboardRepository
  implements IInstructorCourseSpecificDashboardRepository
{
  private _enrollmentRepo: IEnrollmentRepository;
  private _courseRepo: ICourseRepository;
  private _orderRepo: IOrderRepository;

  constructor(
    enrollmentRepo: IEnrollmentRepository,
    courseRepo: ICourseRepository,
    orderRepo: IOrderRepository,
  ) {
    this._enrollmentRepo = enrollmentRepo;
    this._courseRepo = courseRepo;
    this._orderRepo = orderRepo;
  }

  async getCourseRevenue(courseId: Types.ObjectId): Promise<number> {
    const orders = await this._orderRepo.findAll({ status: "SUCCESS" });
    let totalRevenue = 0;

    for (const order of orders || []) {
      // Check standalone courses
      const standaloneCourse = order.courses.find((c) =>
        c.courseId.equals(courseId),
      );
      // Check learning path courses
      const learningPathCourses = order.learningPaths
        .flatMap((lp) => lp.courses)
        .filter((c) => c.courseId.equals(courseId));

      // Calculate total courses (standalone + learning path courses)
      const totalCourses =
        order.courses.length +
        order.learningPaths.reduce((sum, lp) => sum + lp.courses.length, 0);

      // Process standalone course
      if (standaloneCourse) {
        let finalCoursePrice =
          standaloneCourse.offerPrice || standaloneCourse.coursePrice;
        if (order.coupon && totalCourses > 0) {
          const perCourseDeduction = Number(
            (order.coupon.discountAmount / totalCourses).toFixed(2),
          );
          finalCoursePrice = Number(
            (finalCoursePrice - perCourseDeduction).toFixed(2),
          );
        }
        totalRevenue += Number(
          (finalCoursePrice * INSTRUCTOR_REVENUE_SHARE).toFixed(2),
        );
      }

      // Process learning path courses
      for (const lpCourse of learningPathCourses) {
        let finalCoursePrice = lpCourse.offerPrice || lpCourse.coursePrice;
        if (order.coupon && totalCourses > 0) {
          const perCourseDeduction = Number(
            (order.coupon.discountAmount / totalCourses).toFixed(2),
          );
          finalCoursePrice = Number(
            (finalCoursePrice - perCourseDeduction).toFixed(2),
          );
        }
        totalRevenue += Number(
          (finalCoursePrice * INSTRUCTOR_REVENUE_SHARE).toFixed(2),
        );
      }
    }

    return Number(totalRevenue.toFixed(2));
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
      },
    );

    return course?.category && "categoryName" in course.category
      ? (course.category as { categoryName: string }).categoryName
      : null;
  }

  async getMonthlyPerformance(
    courseId: Types.ObjectId,
  ): Promise<{ month: number; year: number; totalSales: number }[]> {
    const orders = await this._orderRepo.findAll({ status: "SUCCESS" });
    const monthlyMap = new Map<string, number>();

    for (const order of orders || []) {
      // Check standalone courses
      const standaloneCourse = order.courses.find((c) =>
        c.courseId.equals(courseId),
      );
      // Check learning path courses
      const learningPathCourses = order.learningPaths
        .flatMap((lp) => lp.courses)
        .filter((c) => c.courseId.equals(courseId));

      // Calculate total courses (standalone + learning path courses)
      const totalCourses =
        order.courses.length +
        order.learningPaths.reduce((sum, lp) => sum + lp.courses.length, 0);

      // Process standalone course
      if (standaloneCourse) {
        let finalCoursePrice =
          standaloneCourse.offerPrice || standaloneCourse.coursePrice;
        if (order.coupon && totalCourses > 0) {
          const perCourseDeduction = Number(
            (order.coupon.discountAmount / totalCourses).toFixed(2),
          );
          finalCoursePrice = Number(
            (finalCoursePrice - perCourseDeduction).toFixed(2),
          );
        }
        const date = order.createdAt;
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyMap.set(
          key,
          Number(
            (
              (monthlyMap.get(key) || 0) +
              Number((finalCoursePrice * INSTRUCTOR_REVENUE_SHARE).toFixed(2))
            ).toFixed(2),
          ),
        );
      }

      // Process learning path courses
      for (const lpCourse of learningPathCourses) {
        let finalCoursePrice = lpCourse.offerPrice || lpCourse.coursePrice;
        if (order.coupon && totalCourses > 0) {
          const perCourseDeduction = Number(
            (order.coupon.discountAmount / totalCourses).toFixed(2),
          );
          finalCoursePrice = Number(
            (finalCoursePrice - perCourseDeduction).toFixed(2),
          );
        }
        const date = order.createdAt;
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyMap.set(
          key,
          Number(
            (
              (monthlyMap.get(key) || 0) +
              Number((finalCoursePrice * INSTRUCTOR_REVENUE_SHARE).toFixed(2))
            ).toFixed(2),
          ),
        );
      }
    }

    return Array.from(monthlyMap.entries()).map(([key, totalSales]) => {
      const [year, month] = key.split("-").map(Number);
      return { month, year, totalSales };
    });
  }

  async getCoursePrice(courseId: Types.ObjectId): Promise<number> {
    const course = await this._courseRepo.findById(courseId.toString());
    return Number((course?.price || 0).toFixed(2));
  }

  async getCourseRevenueReport(
    courseId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    data: {
      orderId: string;
      purchaseDate: string;
      courseName: string;
      originalCoursePrice: number;
      courseOfferPrice: number;
      couponCode: string | null;
      couponUsed: boolean;
      couponDeductionAmount: number;
      finalCoursePrice: number;
      instructorRevenue: number;
      totalEnrollments: number;
    }[];
    total: number;
  }> {
    // Helper function to format date to "day-month-year time AM/PM"
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, "0");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    };

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
          0,
        );
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
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
          999,
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

    const totalPipeline = [
      { $match: { status: "SUCCESS", createdAt: { $gte: start, $lte: end } } },
      {
        $match: {
          $or: [
            { "courses.courseId": courseId },
            { "learningPaths.courses.courseId": courseId },
          ],
        },
      },
      { $count: "total" },
    ];

    const totalResult = await this._orderRepo.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    const { data: orders } = await this._orderRepo.paginate(
      {
        status: "SUCCESS",
        createdAt: { $gte: start, $lte: end },
        $or: [
          { "courses.courseId": courseId },
          { "learningPaths.courses.courseId": courseId },
        ],
      },
      page,
      limit,
      { createdAt: -1 },
    );

    const enrollments = await this.getCourseEnrollmentCount(courseId);
    const results = [];

    for (const order of orders || []) {
      // Calculate total courses (standalone + learning path courses)
      const totalCourses =
        order.courses.length +
        order.learningPaths.reduce((sum, lp) => sum + lp.courses.length, 0);
      const perCourseDeduction =
        order.coupon && totalCourses > 0
          ? Number((order.coupon.discountAmount / totalCourses).toFixed(2))
          : 0;

      // Process standalone course
      const standaloneCourse = order.courses.find((c) =>
        c.courseId.equals(courseId),
      );
      if (standaloneCourse) {
        let finalCoursePrice =
          standaloneCourse.offerPrice || standaloneCourse.coursePrice;
        if (order.coupon && totalCourses > 0) {
          finalCoursePrice = Number(
            (finalCoursePrice - perCourseDeduction).toFixed(2),
          );
        }
        results.push({
          orderId: order._id.toString(),
          purchaseDate: formatDate(order.createdAt),
          courseName: standaloneCourse.courseName,
          originalCoursePrice: Number(standaloneCourse.coursePrice.toFixed(2)),
          courseOfferPrice: Number(
            (
              standaloneCourse.offerPrice || standaloneCourse.coursePrice
            ).toFixed(2),
          ),
          couponCode: order.coupon?.couponName || null,
          couponUsed: !!order.coupon,
          couponDeductionAmount: Number(perCourseDeduction.toFixed(2)),
          finalCoursePrice: Number(finalCoursePrice.toFixed(2)),
          instructorRevenue: Number(
            (finalCoursePrice * INSTRUCTOR_REVENUE_SHARE).toFixed(2),
          ),
          totalEnrollments: enrollments,
        });
      }

      // Process learning path courses
      const learningPathCourses = order.learningPaths
        .flatMap((lp) => lp.courses)
        .filter((c) => c.courseId.equals(courseId));
      for (const lpCourse of learningPathCourses) {
        let finalCoursePrice = lpCourse.offerPrice || lpCourse.coursePrice;
        if (order.coupon && totalCourses > 0) {
          finalCoursePrice = Number(
            (finalCoursePrice - perCourseDeduction).toFixed(2),
          );
        }
        results.push({
          orderId: order._id.toString(),
          purchaseDate: formatDate(order.createdAt),
          courseName: lpCourse.courseName,
          originalCoursePrice: Number(lpCourse.coursePrice.toFixed(2)),
          courseOfferPrice: Number(
            (lpCourse.offerPrice || lpCourse.coursePrice).toFixed(2),
          ),
          couponCode: order.coupon?.couponName || null,
          couponUsed: !!order.coupon,
          couponDeductionAmount: Number(perCourseDeduction.toFixed(2)),
          finalCoursePrice: Number(finalCoursePrice.toFixed(2)),
          instructorRevenue: Number(
            (finalCoursePrice * INSTRUCTOR_REVENUE_SHARE).toFixed(2),
          ),
          totalEnrollments: enrollments,
        });
      }
    }

    return {
      data: results,
      total,
    };
  }
}
