import { Types } from "mongoose";
import {
  ITopSellingCourse,
  ICategorySales,
  IMonthlySales,
  IRevenueReportItem,
} from "../../../interface/instructorInterface/IInstructorInterface";

export interface IInstructorAllCourseDashboardRepository {
  getTopSellingCourses(
    instructorId: Types.ObjectId,
  ): Promise<ITopSellingCourse[]>;
  getCategoryWiseSales(instructorId: Types.ObjectId): Promise<ICategorySales[]>;
  getMonthlySalesGraph(instructorId: Types.ObjectId): Promise<IMonthlySales[]>;
  getTotalRevenue(instructorId: Types.ObjectId): Promise<number>;
  getTotalCourseSales(instructorId: Types.ObjectId): Promise<number>;
  getDetailedRevenueReport(
    instructorId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ data: IRevenueReportItem[]; total: number }>;
}
