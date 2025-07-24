import { IAdminDashboardService } from "../interface/IAdminDashboardService";
import { IAdminDashboardRepository } from "../../repositories/interfaces/IAdminDashboardRepository";

export class AdminDashboardService implements IAdminDashboardService {
  constructor(private readonly dashboardRepo: IAdminDashboardRepository) {}

  async getDashboardMetrics() {
    const [
      instructorCount,
      mentorCount,
      courseCount,
      courseRevenue,
      membershipRevenue,
      courseSalesGraph,
      membershipSalesGraph
    ] = await Promise.all([
      this.dashboardRepo.getInstructorCount(),
      this.dashboardRepo.getMentorCount(),
      this.dashboardRepo.getCourseCount(),
      this.dashboardRepo.getTotalCourseRevenue(),
      this.dashboardRepo.getTotalMembershipRevenue(),
      this.dashboardRepo.getMonthlyCourseSales(),
      this.dashboardRepo.getMonthlyMembershipSales()
    ]);

    return {
      instructorCount,
      mentorCount,
      courseCount,
      courseRevenue,
      membershipRevenue,
      courseSalesGraph,
      membershipSalesGraph
    };
  }

  async getCourseSalesReport(filter: {
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
}> {
  const items = await this.dashboardRepo.getCourseSalesReportFiltered(filter);
  const totalAdminShare = items.reduce((acc, item) => acc + item.adminShare, 0);
  return {
    items,
    totalAdminShare,
  };
}

 

async getMembershipSalesReport(filter: {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
}) {
  const items = await this.dashboardRepo.getMembershipSalesReportFiltered(filter);
  const totalRevenue = items.reduce((acc, item) => acc + item.price, 0);
  const totalSales = items.length;

  return {
    items,
    totalRevenue,
    totalSales,
  };
}
}
