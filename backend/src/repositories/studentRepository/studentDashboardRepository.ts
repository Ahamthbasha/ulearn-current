import { IStudentDashboardRepository } from "./interface/IStudentDashboardRepository"; 
import { EnrollmentRepository } from "../EnrollmentRepository";
import { BookingRepository } from "../BookingRepository";
import { OrderRepository } from "../OrderRepository";
import mongoose from "mongoose";
import { IStudentCourseReportItem, IStudentSlotReportItem } from "../../types/dashboardTypes";
import { getDateRange, ReportFilter } from "../../utils/reportFilterUtils";

export class StudentDashboardRepository implements IStudentDashboardRepository {
  private _enrollmentRepo: EnrollmentRepository;
  private _bookingRepo: BookingRepository;
  private _orderRepo: OrderRepository;

  constructor(
    enrollmentRepo: EnrollmentRepository,
    bookingRepo: BookingRepository,
    orderRepo: OrderRepository
  ) {
    this._enrollmentRepo = enrollmentRepo;
    this._bookingRepo = bookingRepo;
    this._orderRepo = orderRepo;
  }

  async getTotalCoursesPurchased(userId: string): Promise<number> {
    return this._enrollmentRepo.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
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
    const enrollments = await this._enrollmentRepo.find(
      { userId: new mongoose.Types.ObjectId(userId) },
      { path: "courseId", select: "price" }
    );
    return enrollments.reduce((total, e: any) => total + (e.courseId?.price || 0), 0);
  }

  async getTotalSlotBookings(userId: string): Promise<number> {
    return this._bookingRepo.countDocuments({
      studentId: new mongoose.Types.ObjectId(userId),
      status: "confirmed",
      paymentStatus: "paid",
    });
  }

  async getTotalSlotBookingCost(userId: string): Promise<number> {
    const bookings = await this._bookingRepo.find(
      {
        studentId: new mongoose.Types.ObjectId(userId),
        status: "confirmed",
        paymentStatus: "paid",
      },
      { path: "slotId", select: "price" }
    );
    return bookings.reduce((total, b: any) => total + (b.slotId?.price || 0), 0);
  }

  async getMonthlyCoursePerformance(userId: string) {
    return this._enrollmentRepo.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$course.price" },
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

  async getCourseReport(
    userId: string,
    filter: {
      type: ReportFilter;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<IStudentCourseReportItem[]> {
    const { startDate, endDate } = getDateRange(filter.type, filter.startDate, filter.endDate);
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
      { $unwind: "$courseDetails" },
      {
        $group: {
          _id: "$_id",
          date: { $first: "$createdAt" },
          courseName: { $push: "$courseDetails.courseName" },
          price: { $push: "$courseDetails.price" },
          totalCost: { $sum: "$courseDetails.price" },
        },
      },
      {
        $project: {
          _id: 0,
          orderId: "$_id",
          date: 1,
          courseName: 1,
          price: 1,
          totalCost: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    return orders.map((item) => ({
      orderId: item.orderId.toString(),
      date: item.date,
      courseName: item.courseName,
      price: item.price,
      totalCost: item.totalCost,
    }));
  }

  async getSlotReport(
    userId: string,
    filter: {
      type: ReportFilter;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<IStudentSlotReportItem[]> {
    const { startDate, endDate } = getDateRange(filter.type, filter.startDate, filter.endDate);
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
      { $unwind: "$slotDetails" },
      {
        $lookup: {
          from: "instructors",
          localField: "slotDetails.instructorId",
          foreignField: "_id",
          as: "instructorDetails",
        },
      },
      { $unwind: "$instructorDetails" },
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
}