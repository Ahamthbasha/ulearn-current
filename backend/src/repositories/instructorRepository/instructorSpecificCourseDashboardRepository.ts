import { Types } from "mongoose";
import { IInstructorCourseSpecificDashboardRepository } from "../interfaces/IInstructorSpecificCourseDashboardRepository";
import { IPaymentRepository } from "../interfaces/IPaymentRepository";
import { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository";
import { ICourseRepository } from "../interfaces/ICourseRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";

export class InstructorSpecificCourseDashboardRepository
  implements IInstructorCourseSpecificDashboardRepository
{
  constructor(
    private paymentRepo: IPaymentRepository,
    private enrollmentRepo: IEnrollmentRepository,
    private courseRepo: ICourseRepository,
    private orderRepo: IOrderRepository // ✅ Injected
  ) {}

  async getCourseRevenue(courseId: Types.ObjectId): Promise<number> {
    const payments = await this.paymentRepo.findAll({ status: "SUCCESS" });

    let totalRevenue = 0;

    for (const payment of payments || []) {
      const order = await this.orderRepo.findById((payment.orderId as Types.ObjectId).toString());

      if (order?.courses.includes(courseId)) {
        const course = await this.courseRepo.findById(courseId.toString());
        if (course) {
          totalRevenue += course.price;
        }
      }
    }

    return totalRevenue;
  }

  async getCourseEnrollmentCount(courseId: Types.ObjectId): Promise<number> {
    return this.enrollmentRepo
      .findAll({ courseId })
      .then((docs) => docs?.length || 0);
  }

  async getCourseCategory(courseId: Types.ObjectId): Promise<string | null> {
    const course = await this.courseRepo.findByIdWithPopulate(
      courseId.toString(),
      {
        path: "category",
        select: "categoryName"
      }
    );

    //@ts-ignore
    return course?.category?.categoryName || null;
  }

  async getMonthlyPerformance(
    courseId: Types.ObjectId
  ): Promise<{ month: number; year: number; totalSales: number }[]> {
    const payments = await this.paymentRepo.findAll({ status: "SUCCESS" });

    const monthlyMap = new Map<string, number>();

    for (const payment of payments || []) {
      const order = await this.orderRepo.findById((payment.orderId as Types.ObjectId).toString());

      if (order?.courses.includes(courseId)) {
        const course = await this.courseRepo.findById(courseId.toString());
        if (!course) continue;

        const date = payment.createdAt;
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

        monthlyMap.set(key, (monthlyMap.get(key) || 0) + course.price);
      }
    }

    return Array.from(monthlyMap.entries()).map(([key, totalSales]) => {
      const [year, month] = key.split("-").map(Number);
      return { month, year, totalSales };
    });
  }
}
