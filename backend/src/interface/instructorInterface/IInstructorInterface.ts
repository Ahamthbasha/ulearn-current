// export interface ITopSellingCourse {
//   _id: string;
//   courseName: string;
//   thumbnailUrl: string;
//   count: number;
// }

// export interface ICategorySales {
//   _id: string;
//   totalSales: number;
//   categoryName: string;
// }

// export interface IMonthlySales {
//   totalRevenue: number;
//   totalSales: number;
//   year: number;
//   month: number;
// }

// export interface IRevenueReportItem {
//   createdAt: Date;
//   orderId: string;
//   paymentMethod: string;
//   courseName: string;
//   coursePrice: number;
//   instructorEarning: number;
//   totalOrderAmount: number;
// }

// export interface IInstructorDashboard {
//   topCourses: ITopSellingCourse[];
//   categorySales: ICategorySales[];
//   monthlySales: IMonthlySales[];
//   totalRevenue: number;
//   totalCourseSales: number;
//   publishedCourses : number;
//   categoryWiseCount : number;
// }

// export interface IDetailedRevenueReport {
//   data: IRevenueReportItem[];
//   total: number;
// }
























































import { Types } from "mongoose";

export interface ITopSellingCourse {
  _id: Types.ObjectId;
  courseName: string;
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
  orderId: Types.ObjectId;
  orderDate: string;
  courses: IRevenueReportCourse[];
  instructorEarning: number;
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