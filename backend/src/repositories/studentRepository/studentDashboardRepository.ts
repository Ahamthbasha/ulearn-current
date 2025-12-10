import { IStudentDashboardRepository } from "./interface/IStudentDashboardRepository";
import { EnrollmentRepository } from "../EnrollmentRepository";
import { BookingRepository } from "../BookingRepository";
import { OrderRepository } from "../OrderRepository";
import mongoose from "mongoose";
import {
  IStudentCourseReportItem,
  IStudentSlotReportItem,
  OrderItem,
} from "../../types/dashboardTypes";
import { getDateRange, ReportFilter } from "../../utils/reportFilterUtils";
import { formatTo12Hour } from "../../utils/studentReportGenerator";
import { IBooking } from "../../models/bookingModel";
import { isSlot } from "../../models/slotModel";

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
      learningPathId: { $exists: false },
    });
  }

  // Get total learning paths purchased
  async getTotalLearningPathsPurchased(userId: string): Promise<number> {
    const enrollments = await this._enrollmentRepo.aggregate<{ total: number }>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          learningPathId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$learningPathId",
        },
      },
      {
        $count: "total",
      },
    ]);

    return enrollments.length > 0 ? enrollments[0].total : 0;
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
      learningPathId: { $exists: false },
    });
  }

  async getTotalLearningPathsCompleted(userId: string): Promise<number> {
    const learningPaths = await this._enrollmentRepo.aggregate<{ total: number }>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          learningPathId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$learningPathId",
          allCompleted: {
            $min: {
              $cond: [{ $eq: ["$completionStatus", "COMPLETED"] }, true, false],
            },
          },
        },
      },
      {
        $match: {
          allCompleted: true,
        },
      },
      {
        $count: "total",
      },
    ]);

    return learningPaths.length > 0 ? learningPaths[0].total : 0;
  }

  async getTotalLearningPathsNotCompleted(userId: string): Promise<number> {
    const enrollments = await this._enrollmentRepo.aggregate<{ total: number }>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          learningPathId: { $exists: true, $ne: null },
          completionStatus: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
        },
      },
      {
        $group: {
          _id: "$learningPathId",
        },
      },
      {
        $count: "total",
      },
    ]);

    return enrollments.length > 0 ? enrollments[0].total : 0;
  }

  // Get total cost of courses purchased (excluding learning path courses)
  async getTotalCoursePurchaseCost(userId: string): Promise<number> {
    const orders = await this._orderRepo.aggregate<{ finalAmount: number }>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
        },
      },
      {
        $unwind: {
          path: "$courses",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          coursesTotal: {
            $sum: {
              $cond: [
                { $ifNull: ["$courses", false] },
                {
                  $cond: [
                    { $ifNull: ["$courses.offerPrice", false] },
                    "$courses.offerPrice",
                    "$courses.coursePrice",
                  ],
                },
                0,
              ],
            },
          },
          coupon: { $first: "$coupon" },
        },
      },
      {
        $project: {
          coursesTotal: 1,
          discountAmount: {
            $cond: [
              { $ifNull: ["$coupon", false] },
              {
                $multiply: [
                  "$coursesTotal",
                  { $divide: ["$coupon.discountPercentage", 100] },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          finalAmount: {
            $subtract: ["$coursesTotal", "$discountAmount"],
          },
        },
      },
    ]);

    return orders.reduce((total, order) => total + order.finalAmount, 0);
  }

  // Get total cost of learning paths purchased
  async getTotalLearningPathPurchaseCost(userId: string): Promise<number> {
    const orders = await this._orderRepo.aggregate<{ finalAmount: number }>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
        },
      },
      {
        $unwind: {
          path: "$learningPaths",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          learningPathsTotal: {
            $sum: {
              $cond: [
                { $ifNull: ["$learningPaths", false] },
                {
                  $cond: [
                    { $ifNull: ["$learningPaths.offerPrice", false] },
                    "$learningPaths.offerPrice",
                    "$learningPaths.totalPrice",
                  ],
                },
                0,
              ],
            },
          },
          coupon: { $first: "$coupon" },
        },
      },
      {
        $project: {
          learningPathsTotal: 1,
          discountAmount: {
            $cond: [
              { $ifNull: ["$coupon", false] },
              {
                $multiply: [
                  "$learningPathsTotal",
                  { $divide: ["$coupon.discountPercentage", 100] },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          finalAmount: {
            $subtract: ["$learningPathsTotal", "$discountAmount"],
          },
        },
      },
    ]);

    return orders.reduce((total, order) => total + order.finalAmount, 0);
  }

  async getMonthlyCoursePerformance(userId: string) {
    return this._orderRepo.aggregate<{
      month: number;
      year: number;
      count: number;
      totalAmount: number;
    }>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
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

    const orders = await this._orderRepo.aggregate<{
      orderId: mongoose.Types.ObjectId;
      date: string;
      items: OrderItem[];
      originalTotalPrice: number;
      finalTotalPrice: number;
      couponCode?: string;
      couponDiscountPercent?: number;
      couponDiscountAmount?: number;
    }>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "SUCCESS",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          orderId: "$_id",
          date: "$createdAt",
          amount: "$amount",
          coupon: "$coupon",
          items: {
            $concatArrays: [
              {
                $map: {
                  input: { $ifNull: ["$courses", []] },
                  as: "course",
                  in: {
                    type: "course",
                    name: "$$course.courseName",
                    originalPrice: "$$course.coursePrice",
                    offerPrice: "$$course.offerPrice",
                    offerPercentage: "$$course.courseOfferPercentage",
                  },
                },
              },
              {
                $map: {
                  input: { $ifNull: ["$learningPaths", []] },
                  as: "lp",
                  in: {
                    type: "learningPath",
                    name: "$$lp.learningPathName",
                    originalPrice: "$$lp.totalPrice",
                    offerPrice: "$$lp.offerPrice",
                    offerPercentage: "$$lp.offerPercentage",
                  },
                },
              },
            ],
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$orderId",
          date: { $first: "$date" },
          items: { $push: "$items" },
          amount: { $first: "$amount" },
          coupon: { $first: "$coupon" },
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
              timezone: "Asia/Kolkata",
            },
          },
          items: 1,
          originalTotalPrice: {
            $sum: {
              $map: {
                input: "$items",
                as: "item",
                in: "$$item.originalPrice",
              },
            },
          },
          finalTotalPrice: "$amount",
          couponCode: "$coupon.couponName",
          couponDiscountPercent: "$coupon.discountPercentage",
          couponDiscountAmount: "$coupon.discountAmount",
        },
      },
      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return orders.map((item) => {
  const dateObj = new Date(item.date);
  const day = dateObj.getDate().toString().padStart(2, "0");
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedDate = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;

  return {
    orderId: item.orderId.toString(),
    date: formattedDate,
    items: item.items.map((i) => ({
      // Explicitly assert the type as literal union
      type: i.type as "course" | "learningPath",
      name: i.name,
      originalPrice: i.originalPrice,
      finalPrice: i.offerPrice ?? i.originalPrice,
      offerPercentage: i.offerPercentage,
    })),
    originalTotalPrice: item.originalTotalPrice,
    finalTotalPrice: item.finalTotalPrice,
    couponCode: item.couponCode,
    couponDiscountPercent: item.couponDiscountPercent,
    couponDiscountAmount: item.couponDiscountAmount,
  } satisfies IStudentCourseReportItem; // Optional: extra safety
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

  const bookings = await this._bookingRepo.aggregate<{
    bookingId: mongoose.Types.ObjectId;
    date: Date;
    slotTime: {
      startTime: string;
      endTime: string;
    };
    instructorName: string;
    price: number;
    totalPrice: number;
  }>([
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
      $unwind: {
        path: "$slotDetails",
        preserveNullAndEmptyArrays: true, // Keep booking even if slot is missing
      },
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
      $unwind: {
        path: "$instructorDetails",
        preserveNullAndEmptyArrays: true, // Keep if instructor missing
      },
    },
    {
      $project: {
        bookingId: "$_id",
        date: "$createdAt",
        slotTime: {
          startTime: {
            $cond: [
              { $ne: ["$slotDetails.startTime", null] },
              {
                $dateToString: {
                  format: "%H:%M",
                  date: "$slotDetails.startTime",
                  timezone: "Asia/Kolkata",
                },
              },
              "N/A",
            ],
          },
          endTime: {
            $cond: [
              { $ne: ["$slotDetails.endTime", null] },
              {
                $dateToString: {
                  format: "%H:%M",
                  date: "$slotDetails.endTime",
                  timezone: "Asia/Kolkata",
                },
              },
              "N/A",
            ],
          },
        },
        instructorName: {
          $ifNull: ["$instructorDetails.username", "Unknown Instructor"],
        },
        price: {
          $ifNull: ["$slotDetails.price", 0],
        },
        totalPrice: {
          $ifNull: ["$slotDetails.price", 0],
        },
      },
    },
    { $sort: { date: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  return bookings.map((item) => {
    const dateObj = new Date(item.date);
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;

    return {
      bookingId: item.bookingId.toString(),
      date: formattedDate,
      slotTime: {
        startTime: item.slotTime.startTime !== "N/A"
          ? formatTo12Hour(item.slotTime.startTime)
          : "N/A",
        endTime: item.slotTime.endTime !== "N/A"
          ? formatTo12Hour(item.slotTime.endTime)
          : "N/A",
      },
      instructorName: item.instructorName,
      price: item.price,
      totalPrice: item.totalPrice,
    };
  });
}

  // async getSlotReport(
  //   userId: string,
  //   filter: {
  //     type: ReportFilter;
  //     startDate?: string;
  //     endDate?: string;
  //     page?: number;
  //     limit?: number;
  //   },
  // ): Promise<IStudentSlotReportItem[]> {
  //   const { startDate, endDate } = getDateRange(
  //     filter.type,
  //     filter.startDate,
  //     filter.endDate,
  //   );
  //   const page = filter.page || 1;
  //   const limit = filter.limit || 10;
  //   const skip = (page - 1) * limit;

  //   const bookings = await this._bookingRepo.aggregate<{
  //     bookingId: mongoose.Types.ObjectId;
  //     date: Date;
  //     slotTime: {
  //       startTime: string;
  //       endTime: string;
  //     };
  //     instructorName: string;
  //     price: number;
  //     totalPrice: number;
  //   }>([
  //     {
  //       $match: {
  //         studentId: new mongoose.Types.ObjectId(userId),
  //         status: "confirmed",
  //         paymentStatus: "paid",
  //         createdAt: { $gte: startDate, $lte: endDate },
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "slots",
  //         localField: "slotId",
  //         foreignField: "_id",
  //         as: "slotDetails",
  //       },
  //     },
  //     {
  //       $unwind: "$slotDetails",
  //     },
  //     {
  //       $lookup: {
  //         from: "instructors",
  //         localField: "slotDetails.instructorId",
  //         foreignField: "_id",
  //         as: "instructorDetails",
  //       },
  //     },
  //     {
  //       $unwind: "$instructorDetails",
  //     },
  //     {
  //       $project: {
  //         bookingId: "$_id",
  //         date: "$createdAt",
  //         slotTime: {
  //           startTime: {
  //             $dateToString: {
  //               format: "%H:%M",
  //               date: "$slotDetails.startTime",
  //               timezone: "Asia/Kolkata",
  //             },
  //           },
  //           endTime: {
  //             $dateToString: {
  //               format: "%H:%M",
  //               date: "$slotDetails.endTime",
  //               timezone: "Asia/Kolkata",
  //             },
  //           },
  //         },
  //         instructorName: "$instructorDetails.username",
  //         price: "$slotDetails.price",
  //         totalPrice: "$slotDetails.price",
  //       },
  //     },
  //     { $sort: { date: -1 } },
  //     { $skip: skip },
  //     { $limit: limit },
  //   ]);

  //   return bookings.map((item) => {
  //     const dateObj = new Date(item.date);
  //     const day = dateObj.getDate().toString().padStart(2, "0");
  //     const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  //     const year = dateObj.getFullYear();
  //     let hours = dateObj.getHours();
  //     const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  //     const ampm = hours >= 12 ? "PM" : "AM";
  //     hours = hours % 12 || 12;
  //     const formattedDate = `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;

  //     return {
  //       bookingId: item.bookingId.toString(),
  //       date: formattedDate,
  //       slotTime: {
  //         startTime: item.slotTime.startTime
  //           ? formatTo12Hour(item.slotTime.startTime)
  //           : "N/A",
  //         endTime: item.slotTime.endTime
  //           ? formatTo12Hour(item.slotTime.endTime)
  //           : "N/A",
  //       },
  //       instructorName: item.instructorName,
  //       price: item.price,
  //       totalPrice: item.totalPrice,
  //     };
  //   });
  // }

  async getMonthlySlotBookingPerformance(userId: string) {
    return this._bookingRepo.aggregate<{
      month: number;
      year: number;
      count: number;
      totalAmount: number;
    }>([
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
    const bookings: IBooking[] = await this._bookingRepo.find(
      {
        studentId: new mongoose.Types.ObjectId(userId),
        status: "confirmed",
        paymentStatus: "paid",
      },
      { path: "slotId", select: "price" },
    );

    return bookings.reduce((total, b) => {
      if (isSlot(b.slotId)) {
        return total + b.slotId.price;
      }
      return total;
    }, 0);
  }

  async getTotalSlotBookings(userId: string): Promise<number> {
    return this._bookingRepo.countDocuments({
      studentId: new mongoose.Types.ObjectId(userId),
      status: "confirmed",
      paymentStatus: "paid",
    });
  }
}