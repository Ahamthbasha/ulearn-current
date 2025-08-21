// Dashboard Types
export interface ITopSellingCourse {
  _id: string;
  courseName: string;
  thumbnailUrl: string;
  count: number;
}

export interface ICategorySales {
  _id: string;
  totalSales: number;
  categoryName: string;
}

export interface IMonthlySales {
  totalRevenue: number;
  totalSales: number;
  year: number;
  month: number;
}

export interface IRevenueReportItem {
  createdAt: Date;
  orderId: string;
  paymentMethod: string;
  courseName: string;
  coursePrice: number;
  instructorEarning: number;
  totalOrderAmount: number;
}

export interface IInstructorDashboard {
  topCourses: ITopSellingCourse[];
  categorySales: ICategorySales[];
  monthlySales: IMonthlySales[];
  totalRevenue: number;
  totalCourseSales: number;
}

export interface IDetailedRevenueReport {
  data: IRevenueReportItem[];
  total: number;
}
