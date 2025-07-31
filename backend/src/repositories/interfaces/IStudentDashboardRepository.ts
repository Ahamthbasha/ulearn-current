import { IStudentCourseReportItem, IStudentSlotReportItem } from "../../types/dashboardTypes";

export interface IStudentDashboardRepository {
  getTotalCoursesPurchased(userId: string): Promise<number>;
  getTotalCoursesCompleted(userId: string): Promise<number>;
  getTotalCoursesNotCompleted(userId: string): Promise<number>;
  getTotalCoursePurchaseCost(userId: string): Promise<number>;
  getTotalSlotBookings(userId: string): Promise<number>;
  getTotalSlotBookingCost(userId: string): Promise<number>;

  getMonthlyCoursePerformance(userId: string): Promise<
    { month: number; year: number; count: number; totalAmount: number }[]
  >;

  getMonthlySlotBookingPerformance(userId: string): Promise<
    { month: number; year: number; count: number; totalAmount: number }[]
  >;

  getCourseReport(
    userId: string,
    filter: {
      type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<IStudentCourseReportItem[]>;

  getSlotReport(
    userId: string,
    filter: {
      type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<IStudentSlotReportItem[]>;
}