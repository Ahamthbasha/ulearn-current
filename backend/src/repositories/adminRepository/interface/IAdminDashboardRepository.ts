import { IAdminCourseSalesReportItem,IAdminMembershipReportItem } from "../../../types/dashboardTypes";
export interface IAdminDashboardRepository {
  getInstructorCount(): Promise<number>;
  getMentorCount(): Promise<number>;
  getCourseCount(): Promise<number>;
  getTotalCourseRevenue(): Promise<number>;
  getTotalMembershipRevenue(): Promise<number>;
  getMonthlyCourseSales(): Promise<{ month: number; year: number; total: number }[]>;
  getMonthlyMembershipSales(): Promise<{ month: number; year: number; total: number }[]>;

  getCourseSalesReportFiltered(filter: {
    type: "daily" | "weekly" | "monthly" | "custom";
    startDate?: Date;
    endDate?: Date;
  }, page?: number, limit?: number): Promise<{
    items: IAdminCourseSalesReportItem[];
    totalItems: number;
  }>;

  getMembershipSalesReportFiltered(filter: {
    type: "daily" | "weekly" | "monthly" | "custom";
    startDate?: Date;
    endDate?: Date;
  }, page?: number, limit?: number): Promise<{
    items: IAdminMembershipReportItem[];
    totalItems: number;
  }>;

  getTopSellingCourses(limit?: number): Promise<{ courseName: string; salesCount: number }[]>;
  getTopSellingCategories(limit?: number): Promise<{ categoryName: string }[]>;
}