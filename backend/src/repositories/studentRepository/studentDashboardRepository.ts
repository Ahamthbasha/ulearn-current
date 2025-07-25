// import { IStudentDashboardRepository } from "../interfaces/IStudentDashboardRepository";
// import { EnrollmentRepository } from "../EnrollmentRepository";
// import { BookingRepository } from "../BookingRepository";
// import { OrderRepository } from "../OrderRepository";
// import mongoose from "mongoose";
// import { IStudentCourseReportItem, IStudentSlotReportItem } from "../../types/dashboardTypes";
// import { getDateRange, ReportFilter } from "../../utils/reportFilterUtils";

// export class StudentDashboardRepository implements IStudentDashboardRepository {
//   private enrollmentRepo: EnrollmentRepository;
//   private bookingRepo: BookingRepository;
//   private orderRepo: OrderRepository;

//   constructor(
//     enrollmentRepo: EnrollmentRepository,
//     bookingRepo: BookingRepository,
//     orderRepo: OrderRepository
//   ) {
//     this.enrollmentRepo = enrollmentRepo;
//     this.bookingRepo = bookingRepo;
//     this.orderRepo = orderRepo;
//   }

//   async getTotalCoursesPurchased(userId: string): Promise<number> {
//     return this.enrollmentRepo.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
//   }

//   async getTotalCoursesCompleted(userId: string): Promise<number> {
//     return this.enrollmentRepo.countDocuments({
//       userId: new mongoose.Types.ObjectId(userId),
//       completionStatus: "COMPLETED",
//     });
//   }

//   async getTotalCoursesNotCompleted(userId: string): Promise<number> {
//     return this.enrollmentRepo.countDocuments({
//       userId: new mongoose.Types.ObjectId(userId),
//       completionStatus: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
//     });
//   }

//   async getTotalCoursePurchaseCost(userId: string): Promise<number> {
//     const enrollments = await this.enrollmentRepo.find(
//       { userId: new mongoose.Types.ObjectId(userId) },
//       { path: "courseId", select: "price" }
//     );
//     return enrollments.reduce((total, e: any) => total + (e.courseId?.price || 0), 0);
//   }

//   async getTotalSlotBookings(userId: string): Promise<number> {
//     return this.bookingRepo.countDocuments({
//       studentId: new mongoose.Types.ObjectId(userId),
//       status: "confirmed",
//       paymentStatus: "paid",
//     });
//   }

//   async getTotalSlotBookingCost(userId: string): Promise<number> {
//     const bookings = await this.bookingRepo.find(
//       {
//         studentId: new mongoose.Types.ObjectId(userId),
//         status: "confirmed",
//         paymentStatus: "paid",
//       },
//       { path: "slotId", select: "price" }
//     );
//     return bookings.reduce((total, b: any) => total + (b.slotId?.price || 0), 0);
//   }

//   async getMonthlyCoursePerformance(userId: string) {
//     return this.enrollmentRepo.aggregate([
//       { $match: { userId: new mongoose.Types.ObjectId(userId) } },
//       {
//         $lookup: {
//           from: "courses",
//           localField: "courseId",
//           foreignField: "_id",
//           as: "course",
//         },
//       },
//       { $unwind: "$course" },
//       {
//         $group: {
//           _id: {
//             month: { $month: "$createdAt" },
//             year: { $year: "$createdAt" },
//           },
//           count: { $sum: 1 },
//           totalAmount: { $sum: "$course.price" },
//         },
//       },
//       {
//         $project: {
//           month: "$_id.month",
//           year: "$_id.year",
//           count: 1,
//           totalAmount: 1,
//           _id: 0,
//         },
//       },
//       { $sort: { year: 1, month: 1 } },
//     ]);
//   }

//   async getMonthlySlotBookingPerformance(userId: string) {
//     return this.bookingRepo.aggregate([
//       {
//         $match: {
//           studentId: new mongoose.Types.ObjectId(userId),
//           status: "confirmed",
//           paymentStatus: "paid",
//         },
//       },
//       {
//         $lookup: {
//           from: "slots",
//           localField: "slotId",
//           foreignField: "_id",
//           as: "slot",
//         },
//       },
//       { $unwind: "$slot" },
//       {
//         $group: {
//           _id: {
//             month: { $month: "$createdAt" },
//             year: { $year: "$createdAt" },
//           },
//           count: { $sum: 1 },
//           totalAmount: { $sum: "$slot.price" },
//         },
//       },
//       {
//         $project: {
//           month: "$_id.month",
//           year: "$_id.year",
//           count: 1,
//           totalAmount: 1,
//           _id: 0,
//         },
//       },
//       { $sort: { year: 1, month: 1 } },
//     ]);
//   }

//   async getCourseReport(
//     userId: string,
//     filter: {
//       type: ReportFilter;
//       startDate?: string;
//       endDate?: string;
//     }
//   ): Promise<IStudentCourseReportItem[]> {
//     const { startDate, endDate } = getDateRange(filter.type, filter.startDate, filter.endDate);

//     const orders = await this.orderRepo.aggregate([
//       {
//         $match: {
//           userId: new mongoose.Types.ObjectId(userId),
//           status: "SUCCESS",
//           createdAt: { $gte: startDate, $lte: endDate },
//         },
//       },
//       {
//         $unwind: "$courses", // Unwind the courses array to process each course individually
//       },
//       {
//         $lookup: {
//           from: "courses",
//           localField: "courses",
//           foreignField: "_id",
//           as: "courseDetails",
//         },
//       },
//       { $unwind: "$courseDetails" },
//       {
//         $group: {
//           _id: "$_id", // Group by orderId to aggregate all courses in the same order
//           date: { $first: "$createdAt" },
//           courseName: { $push: "$courseDetails.courseName" }, // Array of course names
//           price: { $push: "$courseDetails.price" }, // Array of prices
//           totalCost: { $sum: "$courseDetails.price" }, // Calculate total cost for the order
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           orderId: "$_id",
//           date: 1,
//           courseName: 1, // Keep as array
//           price: 1, // Keep as array
//           totalCost: 1,
//         },
//       },
//     ]);

//     return orders.map((item) => ({
//       orderId: item.orderId.toString(),
//       date: item.date,
//       courseName: item.courseName, // Array of course names
//       price: item.price, // Array of prices
//       totalCost: item.totalCost,
//     }));
//   }

//   async getSlotReport(
//     userId: string,
//     filter: {
//       type: ReportFilter;
//       startDate?: string;
//       endDate?: string;
//     }
//   ): Promise<IStudentSlotReportItem[]> {
//     const { startDate, endDate } = getDateRange(filter.type, filter.startDate, filter.endDate);

//     const bookings = await this.bookingRepo.aggregate([
//       {
//         $match: {
//           studentId: new mongoose.Types.ObjectId(userId),
//           status: "confirmed",
//           paymentStatus: "paid",
//           createdAt: { $gte: startDate, $lte: endDate },
//         },
//       },
//       {
//         $lookup: {
//           from: "slots",
//           localField: "slotId",
//           foreignField: "_id",
//           as: "slotDetails",
//         },
//       },
//       { $unwind: "$slotDetails" },
//       {
//         $lookup: {
//           from: "users",
//           localField: "slotDetails.instructorId",
//           foreignField: "_id",
//           as: "instructorDetails",
//         },
//       },
//       { $unwind: "$instructorDetails" },
//       {
//         $project: {
//           bookingId: "$_id",
//           date: "$createdAt",
//           startTime: "$slotDetails.startTime",
//           endTime: "$slotDetails.endTime",
//           instructorName: "$instructorDetails.username",
//           price: "$slotDetails.price",
//         },
//       },
//     ]);

//     const totalPrice = bookings.reduce((sum, item) => sum + item.price, 0);

//     return bookings.map((item) => ({
//       bookingId: item.bookingId.toString(),
//       date: item.date,
//       slotTime: {
//         startTime: item.startTime,
//         endTime: item.endTime,
//       },
//       instructorName: item.instructorName,
//       price: item.price,
//       totalPrice,
//     }));
//   }
// }

import { IStudentDashboardRepository } from "../interfaces/IStudentDashboardRepository";
import { EnrollmentRepository } from "../EnrollmentRepository";
import { BookingRepository } from "../BookingRepository";
import { OrderRepository } from "../OrderRepository";
import mongoose from "mongoose";
import { IStudentCourseReportItem, IStudentSlotReportItem } from "../../types/dashboardTypes";
import { getDateRange, ReportFilter } from "../../utils/reportFilterUtils";

export class StudentDashboardRepository implements IStudentDashboardRepository {
  private enrollmentRepo: EnrollmentRepository;
  private bookingRepo: BookingRepository;
  private orderRepo: OrderRepository;

  constructor(
    enrollmentRepo: EnrollmentRepository,
    bookingRepo: BookingRepository,
    orderRepo: OrderRepository
  ) {
    this.enrollmentRepo = enrollmentRepo;
    this.bookingRepo = bookingRepo;
    this.orderRepo = orderRepo;
  }

  async getTotalCoursesPurchased(userId: string): Promise<number> {
    return this.enrollmentRepo.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
  }

  async getTotalCoursesCompleted(userId: string): Promise<number> {
    return this.enrollmentRepo.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      completionStatus: "COMPLETED",
    });
  }

  async getTotalCoursesNotCompleted(userId: string): Promise<number> {
    return this.enrollmentRepo.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      completionStatus: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
    });
  }

  async getTotalCoursePurchaseCost(userId: string): Promise<number> {
    const enrollments = await this.enrollmentRepo.find(
      { userId: new mongoose.Types.ObjectId(userId) },
      { path: "courseId", select: "price" }
    );
    return enrollments.reduce((total, e: any) => total + (e.courseId?.price || 0), 0);
  }

  async getTotalSlotBookings(userId: string): Promise<number> {
    return this.bookingRepo.countDocuments({
      studentId: new mongoose.Types.ObjectId(userId),
      status: "confirmed",
      paymentStatus: "paid",
    });
  }

  async getTotalSlotBookingCost(userId: string): Promise<number> {
    const bookings = await this.bookingRepo.find(
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
    return this.enrollmentRepo.aggregate([
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
    return this.bookingRepo.aggregate([
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
    }
  ): Promise<IStudentCourseReportItem[]> {
    const { startDate, endDate } = getDateRange(filter.type, filter.startDate, filter.endDate);

    const orders = await this.orderRepo.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $unwind: "$courses", // Unwind the courses array to process each course individually
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
          _id: "$_id", // Group by orderId to aggregate all courses in the same order
          date: { $first: "$createdAt" },
          courseName: { $push: "$courseDetails.courseName" }, // Array of course names
          price: { $push: "$courseDetails.price" }, // Array of prices
          totalCost: { $sum: "$courseDetails.price" }, // Calculate total cost for the order
        },
      },
      {
        $project: {
          _id: 0,
          orderId: "$_id",
          date: 1,
          courseName: 1, // Keep as array
          price: 1, // Keep as array
          totalCost: 1,
        },
      },
    ]);

    return orders.map((item) => ({
      orderId: item.orderId.toString(),
      date: item.date,
      courseName: item.courseName, // Array of course names
      price: item.price, // Array of prices
      totalCost: item.totalCost,
    }));
  }

  async getSlotReport(
    userId: string,
    filter: {
      type: ReportFilter;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<IStudentSlotReportItem[]> {
    const { startDate, endDate } = getDateRange(filter.type, filter.startDate, filter.endDate);

    const bookings = await this.bookingRepo.aggregate([
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
          totalPrice: "$slotDetails.price", // Corrected to use individual price
        },
      },
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