import { IStudentDashboardRepository } from "./interface/IStudentDashboardRepository";
import { EnrollmentRepository } from "../EnrollmentRepository";
import { BookingRepository } from "../BookingRepository";
import { OrderRepository } from "../OrderRepository";
import mongoose from "mongoose";
import {
  IStudentCourseReportItem,
  IStudentSlotReportItem,
} from "../../types/dashboardTypes";
import { getDateRange, ReportFilter } from "../../utils/reportFilterUtils";

export class StudentDashboardRepository implements IStudentDashboardRepository {
  private _enrollmentRepo: EnrollmentRepository;
  private _bookingRepo: BookingRepository;
  private _orderRepo: OrderRepository;

  constructor(
    enrollmentRepo: EnrollmentRepository,
    bookingRepo: BookingRepository,
    orderRepo: OrderRepository,
  ) {
    this._enrollmentRepo = enrollmentRepo;
    this._bookingRepo = bookingRepo;
    this._orderRepo = orderRepo;
  }

  async getTotalCoursesPurchased(userId: string): Promise<number> {
    return this._enrollmentRepo.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  async getTotalCoursesCompleted(userId: string): Promise<number> {
    return this._enrollmentRepo.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      completionStatus: "COMPLETED",
    });
  }

  async getTotalCoursesNotCompleted(userId: string): Promise<number> {
    return this._enrollmentRepo.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      completionStatus: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
    });
  }

  async getTotalCoursePurchaseCost(userId: string): Promise<number> {
    const orders = await this._orderRepo.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
        },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "coupon",
        },
      },
      {
        $unwind: { path: "$coupon", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: "$courses",
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $unwind: "$courseDetails",
      },
      {
        $group: {
          _id: "$_id",
          originalPrice: { $sum: "$courseDetails.price" },
          finalAmount: { $first: "$amount" },
          coupon: { $first: "$coupon" },
        },
      },
      {
        $project: {
          _id: 0,
          finalAmount: "$finalAmount",
        },
      },
    ]);

    return orders.reduce((total, order) => total + order.finalAmount, 0);
  }


  async getMonthlyCoursePerformance(userId: string) {
    return this._orderRepo.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
        },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "coupon",
        },
      },
      {
        $unwind: { path: "$coupon", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: "$courses",
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            orderId: "$_id",
          },
          originalPrice: { $sum: "$course.price" },
          finalAmount: { $first: "$amount" },
          courseCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: {
            month: "$_id.month",
            year: "$_id.year",
          },
          count: { $sum: "$courseCount" },
          totalAmount: { $sum: "$finalAmount" },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          totalAmount: 1,
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);
  }

 async getCourseReport(
    userId: string,
    filter: {
      type: ReportFilter;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<IStudentCourseReportItem[]> {
    const { startDate, endDate } = getDateRange(
      filter.type,
      filter.startDate,
      filter.endDate,
    );
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const orders = await this._orderRepo.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "coupons",
          localField: "couponId",
          foreignField: "_id",
          as: "coupon",
        },
      },
      {
        $unwind: { path: "$coupon", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: "$courses",
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courseDetails",
        },
      },
      {
        $unwind: "$courseDetails",
      },
      {
        $group: {
          _id: "$_id",
          date: { $first: "$createdAt" },
          courseName: { $push: "$courseDetails.courseName" },
          originalPrice: { $push: "$courseDetails.price" },
          finalAmount: { $first: "$amount" },
          courseCount: { $sum: 1 },
          couponCode: { $first: "$coupon.code" },
          couponDiscountPercent: { $first: "$coupon.discount" },
        },
      },
      {
        $project: {
          _id: 0,
          orderId: "$_id",
          date: {
            $dateToString: {
              format: "%Y-%m-%dT%H:%M:%S",
              date: "$date",
              timezone: "Asia/Kolkata"
            }
          },
          courseName: 1,
          price: {
            $map: {
              input: "$originalPrice",
              as: "price",
              in: {
                $cond: {
                  if: { $gt: ["$courseCount", 0] },
                  then: {
                    $divide: ["$finalAmount", "$courseCount"],
                  },
                  else: "$$price",
                },
              },
            },
          },
          originalTotalPrice: { $sum: "$originalPrice" },
          finalTotalPrice: "$finalAmount",
          couponCode: 1,
          couponDiscountPercent: 1,
          couponDiscountAmount: {
            $subtract: [{ $sum: "$originalPrice" }, "$finalAmount"],
          },
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    return orders.map((item) => {
      // Parse the ISO-like date string and format to day-month-year 12hrs AM/PM
      const dateObj = new Date(item.date);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      let hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // Convert 0 to 12 for midnight
      const formattedDate = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;

      return {
        orderId: item.orderId.toString(),
        date: formattedDate,
        courseName: item.courseName,
        price: item.price,
        totalCost: item.finalTotalPrice,
        couponCode: item.couponCode,
        couponDiscountPercent: item.couponDiscountPercent,
        originalTotalPrice: item.originalTotalPrice,
        finalTotalPrice: item.finalTotalPrice,
        couponDiscountAmount: item.couponDiscountAmount,
      };
    });
  }

  async getSlotReport(
    userId: string,
    filter: {
      type: ReportFilter;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<IStudentSlotReportItem[]> {
    const { startDate, endDate } = getDateRange(
      filter.type,
      filter.startDate,
      filter.endDate,
    );
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const bookings = await this._bookingRepo.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(userId),
          status: "confirmed",
          paymentStatus: "paid",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "slots",
          localField: "slotId",
          foreignField: "_id",
          as: "slotDetails",
        },
      },
      {
        $unwind: "$slotDetails",
      },
      {
        $lookup: {
          from: "instructors",
          localField: "slotDetails.instructorId",
          foreignField: "_id",
          as: "instructorDetails",
        },
      },
      {
        $unwind: "$instructorDetails",
      },
      {
        $project: {
          bookingId: "$_id",
          date: "$createdAt",
          slotTime: {
            startTime: "$slotDetails.startTime",
            endTime: "$slotDetails.endTime",
          },
          instructorName: "$instructorDetails.username",
          price: "$slotDetails.price",
          totalPrice: "$slotDetails.price",
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    return bookings.map((item) => ({
      bookingId: item.bookingId.toString(),
      date: item.date,
      slotTime: item.slotTime,
      instructorName: item.instructorName,
      price: item.price,
      totalPrice: item.totalPrice,
    }));
  }

    async getMonthlySlotBookingPerformance(userId: string) {
    return this._bookingRepo.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(userId),
          status: "confirmed",
          paymentStatus: "paid",
        },
      },
      {
        $lookup: {
          from: "slots",
          localField: "slotId",
          foreignField: "_id",
          as: "slot",
        },
      },
      { $unwind: "$slot" },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$slot.price" },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          totalAmount: 1,
          _id: 0,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);
  }

    async getTotalSlotBookingCost(userId: string): Promise<number> {
    const bookings = await this._bookingRepo.find(
      {
        studentId: new mongoose.Types.ObjectId(userId),
        status: "confirmed",
        paymentStatus: "paid",
      },
      { path: "slotId", select: "price" },
    );
    return bookings.reduce(
      (total, b: any) => total + (b.slotId?.price || 0),
      0,
    );
  }
  
  async getTotalSlotBookings(userId: string): Promise<number> {
    return this._bookingRepo.countDocuments({
      studentId: new mongoose.Types.ObjectId(userId),
      status: "confirmed",
      paymentStatus: "paid",
    });
  }

}