import { Types } from "mongoose";

export interface IInstructorAllCourseDashboardRepository {
  getTopSellingCourses(instructorId: Types.ObjectId): Promise<any[]>;
  getCategoryWiseSales(instructorId: Types.ObjectId): Promise<any[]>;
  getMonthlySalesGraph(instructorId: Types.ObjectId): Promise<any[]>;
  getTotalRevenue(instructorId: Types.ObjectId): Promise<number>;
  getTotalCourseSales(instructorId: Types.ObjectId): Promise<number>;
  getDetailedRevenueReport(
  instructorId: Types.ObjectId,
  range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  startDate?: Date,
  endDate?: Date
): Promise<any[]>;


}
