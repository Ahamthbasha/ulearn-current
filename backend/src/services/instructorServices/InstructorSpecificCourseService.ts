import { Types } from "mongoose";
import { IInstructorCourseSpecificDashboardRepository } from "../../repositories/interfaces/IInstructorSpecificCourseDashboardRepository";
import { IInstructorSpecificCourseDashboardService } from "../interface/IInstructorSpecificCourseService";

export class InstructorSpecificCourseDashboardService
  implements IInstructorSpecificCourseDashboardService
{
  constructor(
    private dashboardRepository: IInstructorCourseSpecificDashboardRepository
  ) {}

  async getCourseDashboard(courseId: Types.ObjectId) {
    const [revenue, enrollments, category, monthlyPerformance, fullPrice] =
      await Promise.all([
        this.dashboardRepository.getCourseRevenue(courseId),
        this.dashboardRepository.getCourseEnrollmentCount(courseId),
        this.dashboardRepository.getCourseCategory(courseId),
        this.dashboardRepository.getMonthlyPerformance(courseId),
        this.dashboardRepository.getCoursePrice(courseId),
      ]);

    return { fullPrice, revenue, enrollments, category, monthlyPerformance };
  }

  async getCourseRevenueReport(
    courseId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date
  ) {
    return this.dashboardRepository.getCourseRevenueReport(
      courseId,
      range,
      page,
      limit,
      startDate,
      endDate
    );
  }
}