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
  topCourses: ITopSellingCourse[];
  categorySales: ICategorySales[];
  monthlySales: IMonthlySales[];
  totalRevenue: number;
  totalCourseSales: number;
  publishedCourses: number;
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
  couponCode: string;
  couponDiscount: number;
  couponDiscountAmount: number | null;
  instructorRevenue: number;
  courses: Array<{
    courseName: string;
    price: number;
  }>;
}

export interface ReportFilter {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
}