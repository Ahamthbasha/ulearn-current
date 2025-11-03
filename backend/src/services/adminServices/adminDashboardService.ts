import { IAdminDashboardService } from "./interface/IAdminDashboardService";
import { IAdminDashboardRepository } from "../../repositories/adminRepository/interface/IAdminDashboardRepository";
import { IAdminCourseSalesReportItem } from "../../types/dashboardTypes";

export class AdminDashboardService implements IAdminDashboardService {
  private _dashboardRepo: IAdminDashboardRepository;

  constructor(dashboardRepo: IAdminDashboardRepository) {
    this._dashboardRepo = dashboardRepo;
  }

  async getDashboardMetrics() {
    const [
      instructorCount,
      mentorCount,
      courseCount,
      courseRevenue,
      membershipRevenue,
      courseSalesGraph,
      membershipSalesGraph,
      topCourses,
      topCategories,
    ] = await Promise.all([
      this._dashboardRepo.getInstructorCount(),
      this._dashboardRepo.getMentorCount(),
      this._dashboardRepo.getCourseCount(),
      this._dashboardRepo.getTotalCourseRevenue(),
      this._dashboardRepo.getTotalMembershipRevenue(),
      this._dashboardRepo.getMonthlyCourseSales(),
      this._dashboardRepo.getMonthlyMembershipSales(),
      this._dashboardRepo.getTopSellingCourses(),
      this._dashboardRepo.getTopSellingCategories(),
    ]);

    return {
      instructorCount,
      mentorCount,
      courseCount,
      courseRevenue,
      membershipRevenue,
      courseSalesGraph,
      membershipSalesGraph,
      topCourses,
      topCategories,
    };
  }

  async getCourseSalesReport(
    filter: {
      type: "daily" | "weekly" | "monthly" | "custom";
      startDate?: Date;
      endDate?: Date;
    },
    page?: number,
    limit?: number,
  ): Promise<{
    items: IAdminCourseSalesReportItem[];
    totalAdminShare: number;
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { items, totalItems } =
      await this._dashboardRepo.getCourseSalesReportFiltered(
        filter,
        page,
        limit,
      );

    const allItemsForTotal =
      await this._dashboardRepo.getCourseSalesReportFiltered(filter);
    const totalAdminShare = allItemsForTotal.items.reduce(
      (acc, item) => acc + (item.totalAdminShare || 0),
      0,
    );

    const calculatedLimit = limit || 10;
    const calculatedPage = page || 1;
    const totalPages = Math.ceil(totalItems / calculatedLimit);

    return {
      items,
      totalAdminShare,
      totalItems,
      totalPages,
      currentPage: calculatedPage,
    };
  }

  async getMembershipSalesReport(
    filter: {
      type: "daily" | "weekly" | "monthly" | "custom";
      startDate?: Date;
      endDate?: Date;
    },
    page?: number,
    limit?: number,
  ): Promise<{
    items: {
      orderId: string;
      planName: string;
      instructorName: string;
      date: string;
      price: number;
    }[];
    totalRevenue: number;
    totalSales: number;
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { items, totalItems } =
      await this._dashboardRepo.getMembershipSalesReportFiltered(
        filter,
        page,
        limit,
      );

    const allItemsForTotal =
      await this._dashboardRepo.getMembershipSalesReportFiltered(filter);
    const totalRevenue = allItemsForTotal.items.reduce(
      (acc, item) => acc + item.price,
      0,
    );

    const totalSales = totalItems;

    const calculatedLimit = limit || 10;
    const calculatedPage = page || 1;
    const totalPages = Math.ceil(totalItems / calculatedLimit);

    return {
      items,
      totalRevenue,
      totalSales,
      totalItems,
      totalPages,
      currentPage: calculatedPage,
    };
  }
}
