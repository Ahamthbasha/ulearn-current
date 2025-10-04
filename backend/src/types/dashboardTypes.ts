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
  _id: {
    year: number;
    month: number;
  };
  totalSales: number;
}

export interface IAdminCourseSalesReportItem {
  orderId: string;
  date: string; // Changed to string for day-month-year format
  couponCode?: string;
  courses: {
    courseName: string;
    coursePrice: number;
    offerPrice?: number; // Added for offerPrice field
    adminShare: number;
    instructorName: string;
    discountedPrice: number;
  }[];
  totalPrice: number;
  discountAmount: number;
  totalAdminShare: number;
}

export interface IAdminCourseSalesReportItemFlattened {
  orderId: string;
  date: Date;
  courseName: string;
  coursePrice: number;
  adminShare: number;
  instructorName: string;
}

export interface IAdminMembershipReportItem {
  orderId: string;
  date: string;
  planName: string;
  instructorName: string;
  price: number;
  paymentMethod?: string;
}

export type FilterType = "daily" | "weekly" | "monthly" | "custom";
export interface IStudentCourseReportItem {
  orderId: string;
  date: string;
  courseName: string[];
  price: number[];
  totalCost: number;
   couponCode?: string;
  couponDiscountPercent?: number;
  originalTotalPrice: number;
  finalTotalPrice: number;
  couponDiscountAmount: number;
}

export interface IStudentSlotReportItem {
  bookingId: string;
  date: Date;
  slotTime: {
    startTime: string;
    endTime: string;
  };
  instructorName: string;
  price: number;
  totalPrice: number;
}


export type AggregationPipelineStage = {
  $match?: { [key: string]: any };
  $unwind?: string | { path: string; preserveNullAndEmptyArrays?: boolean };
  $lookup?: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
  };
  $group?: { [key: string]: any };
  $project?: { [key: string]: any };
  $sort?: { [key: string]: any };
  $skip?: number;
  $limit?: number;
};
