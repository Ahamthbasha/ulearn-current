
import {Types} from "mongoose"

export interface IInstructorCourseSpecificDashboardRepository {
  getCourseRevenue(courseId: Types.ObjectId): Promise<number>;
  getCourseEnrollmentCount(courseId: Types.ObjectId): Promise<number>;
  getCourseCategory(courseId: Types.ObjectId): Promise<string | null>;
  getMonthlyPerformance(
    courseId: Types.ObjectId
  ): Promise<{ month: number; year: number; totalSales: number }[]>;
  getCoursePrice(courseId: Types.ObjectId): Promise<number>;
  getCourseRevenueReport(
    courseId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    orderId: string;
    courseName: string;
    purchaseDate: Date;
    coursePrice: number;
    instructorRevenue: number;
    totalEnrollments:number
  }[]>;
}