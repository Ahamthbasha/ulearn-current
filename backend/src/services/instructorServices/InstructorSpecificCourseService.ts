import { Types } from "mongoose";
import { IInstructorCourseSpecificDashboardRepository } from "../../repositories/instructorRepository/interface/IInstructorSpecificCourseDashboardRepository";
import { IInstructorSpecificCourseDashboardService } from "./interface/IInstructorSpecificCourseService";

export class InstructorSpecificCourseDashboardService
  implements IInstructorSpecificCourseDashboardService
{
  private _dashboardRepository: IInstructorCourseSpecificDashboardRepository;
  constructor(
    dashboardRepository: IInstructorCourseSpecificDashboardRepository,
  ) {
    this._dashboardRepository = dashboardRepository;
  }

  async getCourseDashboard(courseId: Types.ObjectId) {
    const [revenue, enrollments, category, monthlyPerformance, fullPrice] =
      await Promise.all([
        this._dashboardRepository.getCourseRevenue(courseId),
        this._dashboardRepository.getCourseEnrollmentCount(courseId),
        this._dashboardRepository.getCourseCategory(courseId),
        this._dashboardRepository.getMonthlyPerformance(courseId),
        this._dashboardRepository.getCoursePrice(courseId),
      ]);

    return { fullPrice, revenue, enrollments, category, monthlyPerformance };
  }

  async getCourseRevenueReport(
    courseId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this._dashboardRepository.getCourseRevenueReport(
      courseId,
      range,
      page,
      limit,
      startDate,
      endDate,
    );
  }
}
