import { IInstructorSpecificCourseDashboardService } from "../interface/IInstructorSpecificCourseService";
import { IInstructorCourseSpecificDashboardRepository } from "../../repositories/interfaces/IInstructorSpecificCourseDashboardRepository";
import { Types } from "mongoose";

export class InstructorSpecificCourseDashboardService implements IInstructorSpecificCourseDashboardService {
  constructor(private dashboardRepository: IInstructorCourseSpecificDashboardRepository) {}

  async getCourseDashboard(courseId: Types.ObjectId) {
    const [revenue, enrollments, category, monthlyPerformance] = await Promise.all([
      this.dashboardRepository.getCourseRevenue(courseId),
      this.dashboardRepository.getCourseEnrollmentCount(courseId),
      this.dashboardRepository.getCourseCategory(courseId),
      this.dashboardRepository.getMonthlyPerformance(courseId),
    ]);

    return { revenue, enrollments, category, monthlyPerformance };
  }
}