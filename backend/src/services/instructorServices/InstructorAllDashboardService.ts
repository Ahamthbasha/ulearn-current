import { IInstructorAllCourseDashboardService } from "../interface/IInstructorAllDashboardService";
import { IInstructorAllCourseDashboardRepository } from "src/repositories/interfaces/IInstructorAllCourseDashboardRepository";
import { Types } from "mongoose";

export class InstructorAllCourseDashboardService implements IInstructorAllCourseDashboardService {
  constructor(
    private dashboardRepo: IInstructorAllCourseDashboardRepository
  ) {}

  async getInstructorDashboard(instructorId: Types.ObjectId): Promise<any> {
    const [topCourses, categorySales, monthlySales, totalRevenue, totalCourseSales] = await Promise.all([
      this.dashboardRepo.getTopSellingCourses(instructorId),
      this.dashboardRepo.getCategoryWiseSales(instructorId),
      this.dashboardRepo.getMonthlySalesGraph(instructorId),
      this.dashboardRepo.getTotalRevenue(instructorId),
      this.dashboardRepo.getTotalCourseSales(instructorId),
    ]);

    return {
      topCourses,
      categorySales,
      monthlySales,
      totalRevenue,
      totalCourseSales,
    };
  }

  async getDetailedRevenueReport(
  instructorId: Types.ObjectId,
  range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  startDate?: Date,
  endDate?: Date
): Promise<any[]> {
  return this.dashboardRepo.getDetailedRevenueReport(instructorId, range, startDate, endDate);
}



}
