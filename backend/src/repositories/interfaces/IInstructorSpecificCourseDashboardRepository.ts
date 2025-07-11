import { Types } from "mongoose";

export interface IInstructorCourseSpecificDashboardRepository {
  
  getCourseRevenue(courseId: Types.ObjectId): Promise<number>;
  getCourseEnrollmentCount(courseId: Types.ObjectId): Promise<number>;
  getCourseCategory(courseId: Types.ObjectId): Promise<string | null>;
  getMonthlyPerformance(courseId: Types.ObjectId): Promise<{ month: number; year: number; totalSales: number }[]>;

}