import { Types } from "mongoose";

export interface IInstructorSpecificCourseDashboardService {
  getCourseDashboard(courseId: Types.ObjectId): Promise<{
    revenue: number;
    enrollments: number;
    category: string | null;
    monthlyPerformance: { month: number; year: number; totalSales: number }[];
  }>;
}