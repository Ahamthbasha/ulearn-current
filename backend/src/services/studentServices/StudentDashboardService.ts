import { IStudentDashboardService } from "../interface/IStudentDashboardService";
import { IStudentDashboardRepository } from "../../repositories/interfaces/IStudentDashboardRepository";
import { IStudentCourseReportItem, IStudentSlotReportItem } from "../../types/dashboardTypes";

export class StudentDashboardService implements IStudentDashboardService {
  private dashboardRepo: IStudentDashboardRepository;

  constructor(dashboardRepo: IStudentDashboardRepository) {
    this.dashboardRepo = dashboardRepo;
  }

  async getStudentDashboardData(userId: string) {
    const [
      totalCoursesPurchased,
      totalCoursesCompleted,
      totalCoursesNotCompleted,
      totalCoursePurchaseCost,
      totalSlotBookings,
      totalSlotBookingCost
    ] = await Promise.all([
      this.dashboardRepo.getTotalCoursesPurchased(userId),
      this.dashboardRepo.getTotalCoursesCompleted(userId),
      this.dashboardRepo.getTotalCoursesNotCompleted(userId),
      this.dashboardRepo.getTotalCoursePurchaseCost(userId),
      this.dashboardRepo.getTotalSlotBookings(userId),
      this.dashboardRepo.getTotalSlotBookingCost(userId),
    ]);

    return {
      totalCoursesPurchased,
      totalCoursesCompleted,
      totalCoursesNotCompleted,
      totalCoursePurchaseCost,
      totalSlotBookings,
      totalSlotBookingCost
    };
  }

  async getMonthlyPerformance(userId: string) {
    const [coursePerformance, slotPerformance] = await Promise.all([
      this.dashboardRepo.getMonthlyCoursePerformance(userId),
      this.dashboardRepo.getMonthlySlotBookingPerformance(userId)
    ]);

    return { coursePerformance, slotPerformance };
  }

  async getCourseReport(
    userId: string,
    filter: {
      type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
      startDate?: string;
      endDate?: string;
    }
  ): Promise<IStudentCourseReportItem[]> {
    return this.dashboardRepo.getCourseReport(userId, filter);
  }

  async getSlotReport(
    userId: string,
    filter: {
      type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
      startDate?: string;
      endDate?: string;
    }
  ): Promise<IStudentSlotReportItem[]> {
    return this.dashboardRepo.getSlotReport(userId, filter);
  }
}