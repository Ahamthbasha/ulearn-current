export interface ITopSellingCourse {
    _id:string,
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
}


export interface ReportFilter {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
}