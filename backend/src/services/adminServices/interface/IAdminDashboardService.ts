import { IAdminCourseSalesReportItem } from "../../../types/dashboardTypes";

export interface IAdminDashboardService {
  getDashboardMetrics(): Promise<{
    instructorCount: number;
    mentorCount: number;
    courseCount: number;
    courseRevenue: number;
    membershipRevenue: number;
    courseSalesGraph: { month: number; year: number; total: number }[];
    membershipSalesGraph: { month: number; year: number; total: number }[];
    topCourses: { courseName: string; salesCount: number }[];
    topCategories: { categoryName: string }[];
  }>;

  getCourseSalesReport(
    filter: {
      type: "daily" | "weekly" | "monthly" | "custom";
      startDate?: Date;
      endDate?: Date;
    },
    page?: number,
    limit?: number,
  ): Promise<{
    items: IAdminCourseSalesReportItem[];
    totalAdminShare: number;
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }>;

  getMembershipSalesReport(
    filter: {
      type: "daily" | "weekly" | "monthly" | "custom";
      startDate?: Date;
      endDate?: Date;
    },
    page?: number,
    limit?: number,
  ): Promise<{
    items: {
      orderId: string;
      planName: string;
      instructorName: string;
      date: string;
      price: number;
    }[];
    totalRevenue: number;
    totalSales: number;
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }>;
}
