import { Types } from "mongoose";
import {
  ITopSellingCourse,
  ITopSellingLearningPath,
  ICategorySales,
  IMonthlySales,
  IRevenueReportItem,
} from "../../../interface/instructorInterface/IInstructorInterface";

export interface IInstructorAllCourseDashboardRepository {
  getTopSellingCourses(
    instructorId: Types.ObjectId,
  ): Promise<ITopSellingCourse[]>;
  getTopSellingLearningPaths(
    instructorId: Types.ObjectId,
  ): Promise<ITopSellingLearningPath[]>;
  getCategoryWiseSales(instructorId: Types.ObjectId): Promise<ICategorySales[]>;
  getMonthlySalesGraph(instructorId: Types.ObjectId): Promise<IMonthlySales[]>;
  getTotalRevenue(instructorId: Types.ObjectId): Promise<number>;
  getTotalCourseSales(instructorId: Types.ObjectId): Promise<number>;
  getTotalLearningPathSales(instructorId: Types.ObjectId): Promise<number>;
  getPublishedCoursesCount(instructorId: Types.ObjectId): Promise<number>;
  getPublishedLearningPathsCount(instructorId: Types.ObjectId): Promise<number>;
  getCategoryWiseCreatedCourses(instructorId: Types.ObjectId): Promise<number>;
  getDetailedRevenueReport(
    instructorId: Types.ObjectId,
    range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
    page: number,
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ data: IRevenueReportItem[]; total: number }>;
}
