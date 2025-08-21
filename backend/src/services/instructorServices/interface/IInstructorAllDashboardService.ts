import { Types } from "mongoose";
import {
  IInstructorDashboard,
  IDetailedRevenueReport
} from "../../../interface/instructorInterface/IInstructorInterface";

export interface IInstructorAllCourseDashboardService {
  getInstructorDashboard(instructorId: Types.ObjectId): Promise<IInstructorDashboard>;
  getDetailedRevenueReport(
    instructorId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<IDetailedRevenueReport>;
}