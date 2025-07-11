import { Types } from "mongoose";

export interface IInstructorAllCourseDashboardService {
  getInstructorDashboard(instructorId: Types.ObjectId): Promise<any>;
  getDetailedRevenueReport(
  instructorId: Types.ObjectId,
  range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  startDate?: Date,
  endDate?: Date
): Promise<any[]>;



}
