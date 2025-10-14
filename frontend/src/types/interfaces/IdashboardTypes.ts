export interface ITopSellingCourse {
  _id: string;
  courseName: string;
  thumbnailUrl: string;
  count: number;
}

export interface ICategorySales {
  categoryName: string;
  totalSales: number;
}

export interface IMonthlySales {
  month: number;
  year: number;
  totalSales: number;
  totalRevenue: number;
}

export interface IDashboardData {
  topCourses: {
    _id: string;
    courseName: string;
    thumbnailUrl: string;
    count: number;
  }[];
  topLearningPaths: {
    _id: string;
    learningPathName: string;
    thumbnailUrl: string;
    count: number;
  }[];
  categorySales: {
    categoryName: string;
    totalSales: number;
  }[];
  monthlySales: {
    year: number;
    month: number;
    totalRevenue: number;
    totalSales: number;
    courseSales: number;
    learningPathSales: number;
  }[];
  totalRevenue: number;
  totalCourseSales: number;
  totalLearningPathSales: number;
  publishedCourses: number;
  publishedLearningPaths: number;
  categoryWiseCount: number;
}

export interface IRevenueReportCourse {
  courseName: string;
  courseOriginalPrice: number;
  courseOfferPrice: number;
  couponCode: string;
  couponDiscountAmount: number;
  couponDiscount: number;
  finalCoursePrice: number;
}

export interface IRevenueReportItem {
  orderId: string;
  date: string;
  totalOrderAmount: number;
  instructorRevenue: number;
  couponCode: string;
  couponDiscount: number;
  couponDiscountAmount: number;
  standaloneCourse: {
    courseName: string;
    standAloneCourseTotalPrice: number;
  }[];
  learningPath: {
    learningPathName: string;
    learningPathTotalPrice: number;
  }[];
}

export interface ReportFilter {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
}