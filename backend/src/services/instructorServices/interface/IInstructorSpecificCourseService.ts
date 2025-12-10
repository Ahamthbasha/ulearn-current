import { Types } from "mongoose";

export interface IInstructorSpecificCourseDashboardService {
  getCourseDashboard(courseId: Types.ObjectId): Promise<{
    fullPrice: number;
    revenue: number;
    enrollments: number;
    category: string | null;
    monthlyPerformance: { month: number; year: number; totalSales: number }[];
  }>;
  getCourseRevenueReport(
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
  }>;
}
