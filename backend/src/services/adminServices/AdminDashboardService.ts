import { IAdminDashboardService } from "../interface/IAdminDashboardService";
import { IAdminDashboardRepository } from "../../repositories/interfaces/IAdminDashboardRepository";
import { IAdminCourseSalesReportItem } from "../../types/dashboardTypes";

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
      membershipSalesGraph,
      topCourses,
      topCategories
    ] = await Promise.all([
      this.dashboardRepo.getInstructorCount(),
      this.dashboardRepo.getMentorCount(),
      this.dashboardRepo.getCourseCount(),
      this.dashboardRepo.getTotalCourseRevenue(),
      this.dashboardRepo.getTotalMembershipRevenue(),
      this.dashboardRepo.getMonthlyCourseSales(),
      this.dashboardRepo.getMonthlyMembershipSales(),
      this.dashboardRepo.getTopSellingCourses(),
      this.dashboardRepo.getTopSellingCategories()
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
      topCategories
    };
  }

  async getCourseSalesReport(filter: {
    type: "daily" | "weekly" | "monthly" | "custom";
    startDate?: Date;
    endDate?: Date;
  }, page?: number, limit?: number): Promise<{
    items: IAdminCourseSalesReportItem[];
    totalAdminShare: number;
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { items, totalItems } = await this.dashboardRepo.getCourseSalesReportFiltered(filter, page, limit);
    
    // FIX 1: Calculate totalAdminShare from all items, not just current page
    // For pagination, we need to get total admin share for the entire dataset
    const allItemsForTotal = await this.dashboardRepo.getCourseSalesReportFiltered(filter); // No pagination for total calculation
    const totalAdminShare = allItemsForTotal.items.reduce((acc, item) => acc + (item.totalAdminShare || 0), 0);
    
    // FIX 2: Handle case when no pagination parameters provided
    const calculatedLimit = limit || 10; // Default limit
    const calculatedPage = page || 1; // Default page
    const totalPages = Math.ceil(totalItems / calculatedLimit);

    return {
      items,
      totalAdminShare,
      totalItems,
      totalPages,
      currentPage: calculatedPage,
    };
  }

  async getMembershipSalesReport(filter: {
    type: "daily" | "weekly" | "monthly" | "custom";
    startDate?: Date;
    endDate?: Date;
  }, page?: number, limit?: number): Promise<{
    items: {
      orderId: string;
      planName: string;
      instructorName: string;
      date: Date;
      price: number;
    }[];
    totalRevenue: number;
    totalSales: number;
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    const { items, totalItems } = await this.dashboardRepo.getMembershipSalesReportFiltered(filter, page, limit);
    
    // FIX 3: Calculate totalRevenue from all items, not just current page
    // For pagination, we need to get total revenue for the entire dataset
    const allItemsForTotal = await this.dashboardRepo.getMembershipSalesReportFiltered(filter); // No pagination for total calculation
    const totalRevenue = allItemsForTotal.items.reduce((acc, item) => acc + item.price, 0);
    
    // FIX 4: totalSales should be totalItems, not current page items length
    const totalSales = totalItems; // Total number of sales across all pages
    
    const calculatedLimit = limit || 10; // Default limit
    const calculatedPage = page || 1; // Default page
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
