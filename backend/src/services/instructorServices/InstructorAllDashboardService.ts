import { IInstructorAllCourseDashboardService } from "./interface/IInstructorAllDashboardService";
import { IInstructorAllCourseDashboardRepository } from "../../repositories/instructorRepository/interface/IInstructorAllCourseDashboardRepository";
import { Types } from "mongoose";
import {
  IInstructorDashboard,
  IDetailedRevenueReport,
} from "../../interface/instructorInterface/IInstructorInterface";

export class InstructorAllCourseDashboardService
  implements IInstructorAllCourseDashboardService
{
  private _dashboardRepo: IInstructorAllCourseDashboardRepository;

  constructor(dashboardRepo: IInstructorAllCourseDashboardRepository) {
    this._dashboardRepo = dashboardRepo;
  }

  async getInstructorDashboard(
    instructorId: Types.ObjectId,
  ): Promise<IInstructorDashboard> {
    const [
      topCourses,
      topLearningPaths,
      categorySales,
      monthlySales,
      totalRevenue,
      totalCourseSales,
      totalLearningPathSales,
      publishedCourses,
      publishedLearningPaths,
      categoryWiseCount,
    ] = await Promise.all([
      this._dashboardRepo.getTopSellingCourses(instructorId),
      this._dashboardRepo.getTopSellingLearningPaths(instructorId),
      this._dashboardRepo.getCategoryWiseSales(instructorId),
      this._dashboardRepo.getMonthlySalesGraph(instructorId),
      this._dashboardRepo.getTotalRevenue(instructorId),
      this._dashboardRepo.getTotalCourseSales(instructorId),
      this._dashboardRepo.getTotalLearningPathSales(instructorId),
      this._dashboardRepo.getPublishedCoursesCount(instructorId),
      this._dashboardRepo.getPublishedLearningPathsCount(instructorId),
      this._dashboardRepo.getCategoryWiseCreatedCourses(instructorId),
    ]);

    return {
      topCourses,
      topLearningPaths,
      categorySales,
      monthlySales,
      totalRevenue,
      totalCourseSales,
      totalLearningPathSales,
      publishedCourses,
      publishedLearningPaths,
      categoryWiseCount,
    };
  }

  async getDetailedRevenueReport(
    instructorId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IDetailedRevenueReport> {
    return this._dashboardRepo.getDetailedRevenueReport(
      instructorId,
      range,
      page,
      limit,
      startDate,
      endDate,
    );
  }
}
