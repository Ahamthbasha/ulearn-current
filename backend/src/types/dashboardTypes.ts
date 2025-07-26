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
  date: Date;
  courses: {
    courseName: string;
    coursePrice: number;
    adminShare: number;
    instructorName: string;
  }[];
  totalPrice:number;
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
  date: Date;
  planName: string;
  instructorName: string;
  price: number;
  paymentMethod?: string;
}

export type FilterType = "daily" | "weekly" | "monthly" | "custom";
export interface IStudentCourseReportItem {
  orderId: string;
  date: Date;
  courseName: string;
  price: number;
  totalCost: number;
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


// types/aggregationTypes.ts
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
  // Add other stages as needed (e.g., $facet, $out, etc.)
};