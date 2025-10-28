import { IStudentDashboardService } from "./interface/IStudentDashboardService";
import { IStudentDashboardRepository } from "../../repositories/studentRepository/interface/IStudentDashboardRepository";
import {
  IStudentCourseReportItem,
  IStudentSlotReportItem,
} from "../../types/dashboardTypes";

export class StudentDashboardService implements IStudentDashboardService {
  private _dashboardRepo: IStudentDashboardRepository;

  constructor(dashboardRepo: IStudentDashboardRepository) {
    this._dashboardRepo = dashboardRepo;
  }

  async getStudentDashboardData(userId: string) {
    const [
      totalCoursesPurchased,
      totalLearningPathsPurchased,
      totalCoursesCompleted,
      totalCoursesNotCompleted,
      totalLearningPathsCompleted,
      totalLearningPathsNotCompleted,
      totalCoursePurchaseCost,
      totalLearningPathPurchaseCost,
      totalSlotBookings,
      totalSlotBookingCost,
    ] = await Promise.all([
      this._dashboardRepo.getTotalCoursesPurchased(userId),
      this._dashboardRepo.getTotalLearningPathsPurchased(userId),
      this._dashboardRepo.getTotalCoursesCompleted(userId),
      this._dashboardRepo.getTotalCoursesNotCompleted(userId),
      this._dashboardRepo.getTotalLearningPathsCompleted(userId),
      this._dashboardRepo.getTotalLearningPathsNotCompleted(userId),
      this._dashboardRepo.getTotalCoursePurchaseCost(userId),
      this._dashboardRepo.getTotalLearningPathPurchaseCost(userId),
      this._dashboardRepo.getTotalSlotBookings(userId),
      this._dashboardRepo.getTotalSlotBookingCost(userId),
    ]);

    return {
      totalCoursesPurchased,
      totalLearningPathsPurchased,
      totalCoursesCompleted,
      totalCoursesNotCompleted,
      totalLearningPathsCompleted,
      totalLearningPathsNotCompleted,
      totalCoursePurchaseCost,
      totalLearningPathPurchaseCost,
      totalSlotBookings,
      totalSlotBookingCost,
    };
  }

  async getMonthlyPerformance(userId: string) {
    const [coursePerformance, slotPerformance] = await Promise.all([
      this._dashboardRepo.getMonthlyCoursePerformance(userId),
      this._dashboardRepo.getMonthlySlotBookingPerformance(userId),
    ]);

    return { coursePerformance, slotPerformance };
  }

  async getCourseReport(
    userId: string,
    filter: {
      type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<IStudentCourseReportItem[]> {
    return this._dashboardRepo.getCourseReport(userId, filter);
  }

  async getSlotReport(
    userId: string,
    filter: {
      type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<IStudentSlotReportItem[]> {
    return this._dashboardRepo.getSlotReport(userId, filter);
  }
}
