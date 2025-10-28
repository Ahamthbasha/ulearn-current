import { Types } from "mongoose";

export interface ITopSellingCourse {
  _id: Types.ObjectId;
  courseName: string;
  thumbnailUrl: string;
  count: number;
}

export interface ITopSellingLearningPath {
  _id: Types.ObjectId;
  learningPathName: string;
  thumbnailUrl: string;
  count: number;
}

export interface ICategorySales {
  categoryName: string;
  totalSales: number;
}

export interface IMonthlySales {
  year: number;
  month: number;
  totalRevenue: number;
  totalSales: number;
  courseSales: number;
  learningPathSales: number;
}

export interface IStandaloneCourse {
  courseName: string;
  offerPrice: number;
  finalPrice: number;
}

export interface ILearningPath {
  learningPathName: string;
  learningPathTotalPrice: number;
  learningPathFinalPrice: number;
}

export interface IRevenueReportItem {
  orderId: Types.ObjectId;
  date: string;
  totalOrderAmount: number;
  instructorEarnings: number;
  instructorRevenue:number;
  couponCode: string;
  couponDiscount: number;
  couponDiscountAmount: number;
  standaloneCourse: IStandaloneCourse[];
  learningPath: ILearningPath[];
}

export interface IInstructorDashboard {
  topCourses: ITopSellingCourse[];
  topLearningPaths: ITopSellingLearningPath[];
  categorySales: ICategorySales[];
  monthlySales: IMonthlySales[];
  totalRevenue: number;
  totalCourseSales: number;
  totalLearningPathSales: number;
  publishedCourses: number;
  publishedLearningPaths: number;
  categoryWiseCount: number;
}

export interface IDetailedRevenueReport {
  data: IRevenueReportItem[];
  total: number;
}
