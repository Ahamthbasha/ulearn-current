import { Types } from "mongoose";

export interface DebugItem {
  courseId: string;
  offerPrice: number;
  coursePrice: number;
  perItemDiscount: number;
  effectiveCoursePrice: number;
  couponDiscount: number;
  totalStandaloneCourses: number;
  totalLPCourses: number;
  totalItems: number;
}


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
  orderId: string;
  date: string;
  totalOrderAmount: number;
  couponCode: string;
  couponDiscount: number;
  couponDiscountAmount: number | null;
  instructorRevenue: number;
  courses: Array<{
    courseName: string;
    price: number;
  }>;
}

export interface IInstructorDashboard {
  topCourses: ITopSellingCourse[];
  categorySales: ICategorySales[];
  monthlySales: IMonthlySales[];
  totalRevenue: number;
  totalCourseSales: number;
  publishedCourses: number;
  categoryWiseCount: number;
}

export interface IDetailedRevenueReport {
  data: IRevenueReportItem[];
  total: number;
}


export interface ModuleValidationError {
  moduleId: string;
  moduleTitle: string;
  missingChapters: boolean;
  missingQuiz: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ModuleValidationError[];
}