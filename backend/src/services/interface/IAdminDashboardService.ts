export interface IAdminDashboardService {
  getDashboardMetrics(): Promise<{
    instructorCount: number;
    mentorCount: number;
    courseCount: number;
    courseRevenue: number;
    membershipRevenue: number;
    courseSalesGraph: { month: number; year: number; total: number }[];
    membershipSalesGraph: { month: number; year: number; total: number }[];
  }>;

  getCourseSalesReport(filter: {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  items: {
    orderId: string;
    date: Date;
    courseName: string;
    coursePrice: number;
    adminShare: number;
    instructorName: string;
  }[];
  totalAdminShare: number;
}>;

getMembershipSalesReport(filter: {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  items: {
    orderId: string;
    planName: string;
    instructorName: string;
    date: Date;
    price: number;
  }[];
  totalRevenue: number;
  totalSales: number;
}>;



}
