import { IStudentCourseReportItem, IStudentSlotReportItem } from "../../../types/dashboardTypes";

export interface IStudentDashboardService {
  getStudentDashboardData(userId: string): Promise<{
    totalCoursesPurchased: number;
    totalCoursesCompleted: number;
    totalCoursesNotCompleted: number;
    totalCoursePurchaseCost: number;
    totalSlotBookings: number;
    totalSlotBookingCost: number;
  }>;

  getMonthlyPerformance(userId: string): Promise<{
    coursePerformance: { month: number; year: number; count: number; totalAmount: number }[];
    slotPerformance: { month: number; year: number; count: number; totalAmount: number }[];
  }>;

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