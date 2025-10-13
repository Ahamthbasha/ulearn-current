import { Types } from "mongoose";
import mongoose from "mongoose";
import { IOrder } from "../../models/orderModel";
import { IEnrollment } from "../../models/enrollmentModel";
import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
import { IStudentCheckoutRepository } from "./interface/IStudentCheckoutRepository";
import { IOrderRepository } from "../interfaces/IOrderRepository";
import { IEnrollmentRepository } from "../interfaces/IEnrollmentRepository";
import { ILearningPathEnrollmentRepo } from "../interfaces/ILearningPathEnrollmentRepo";
import { ICourseRepository } from "../interfaces/ICourseRepository";
import { ILearningPathRepository } from "../interfaces/ILearningPathRepository";
import { IStudentCourseOfferRepository } from "./interface/IStudentCourseOfferRepo";
import { ICourseOffer } from "../../models/courseOfferModel";

export class StudentCheckoutRepository implements IStudentCheckoutRepository {
  private _orderRepo: IOrderRepository;
  private _enrollmentRepo: IEnrollmentRepository;
  private _learningPathEnrollmentRepo: ILearningPathEnrollmentRepo;
  private _courseRepo: ICourseRepository;
  private _learningPathRepo: ILearningPathRepository;
  private _courseOfferRepo: IStudentCourseOfferRepository;

  constructor(
    orderRepo: IOrderRepository,
    enrollmentRepo: IEnrollmentRepository,
    learningPathEnrollmentRepo: ILearningPathEnrollmentRepo,
    courseRepo: ICourseRepository,
    learningPathRepo: ILearningPathRepository,
    courseOfferRepo: IStudentCourseOfferRepository,
  ) {
    this._orderRepo = orderRepo;
    this._enrollmentRepo = enrollmentRepo;
    this._learningPathEnrollmentRepo = learningPathEnrollmentRepo;
    this._courseRepo = courseRepo;
    this._learningPathRepo = learningPathRepo;
    this._courseOfferRepo = courseOfferRepo;
  }

  async createOrder(
    orderData: Partial<IOrder>,
    session?: mongoose.ClientSession,
  ): Promise<IOrder> {
    if (session) {
      return this._orderRepo.createWithSession(orderData, session);
    }
    return this._orderRepo.create(orderData);
  }

  async updateOrderStatus(
    orderId: Types.ObjectId,
    status: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING",
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null> {
    if (session) {
      return this._orderRepo.updateWithSession(
        orderId.toString(),
        { status },
        session,
      );
    }
    return this._orderRepo.update(orderId.toString(), { status });
  }

  async updateOrder(
    orderId: Types.ObjectId,
    updates: Partial<IOrder>,
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null> {
    if (session) {
      return this._orderRepo.updateWithSession(
        orderId.toString(),
        updates,
        session,
      );
    }
    return this._orderRepo.update(orderId.toString(), updates);
  }

  async createEnrollments(
    enrollments: Partial<IEnrollment>[],
    session?: mongoose.ClientSession,
  ): Promise<IEnrollment[]> {
    if (session) {
      return this._enrollmentRepo.createManyWithSession(
        enrollments,
        session,
      );
    }
    return this._enrollmentRepo.createMany(enrollments);
  }

  async createLearningPathEnrollments(
    enrollments: Partial<ILearningPathEnrollment>[],
    session?: mongoose.ClientSession,
  ): Promise<ILearningPathEnrollment[]> {
    if (session) {
      return this._learningPathEnrollmentRepo.createManyWithSession(
        enrollments,
        session,
      );
    }
    return this._learningPathEnrollmentRepo.createMany(enrollments);
  }

  async getCourseNamesByIds(
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<string[]> {
    const filter = { _id: { $in: courseIds } };
    let courses;

    if (session) {
      courses = await this._courseRepo.findAllWithSession(filter, session);
    } else {
      courses = await this._courseRepo.findAll(filter);
    }

    return (courses || []).map((c) => c.courseName);
  }

  async getLearningPathNamesByIds(
    learningPathIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<{ name: string; totalPrice: number }[]> {
    const filter = { _id: { $in: learningPathIds } };
    let paths;

    if (session) {
      paths = await this._learningPathRepo.findAllWithSession(filter, session, [
        {
          path: "courses",
          select: "price effectivePrice",
          match: { isPublished: true },
        },
      ]);
    } else {
      paths = await this._learningPathRepo.findAll(filter, [
        {
          path: "courses",
          select: "price effectivePrice",
          match: { isPublished: true },
        },
      ]);
    }

    if (!paths) {
      return [];
    }

    const courseIds = paths
      .flatMap((path) => path.courses?.map((course) => course._id) || [])
      .filter((id): id is Types.ObjectId => id instanceof Types.ObjectId);

    const offerMap = await this.getValidCourseOffers(courseIds, session);

    const result = await Promise.all(
      paths.map(async (path) => {
        let totalPrice = 0;

        if (path.courses && Array.isArray(path.courses)) {
          for (const course of path.courses) {
            const courseId = course._id.toString();
            const offer = offerMap.get(courseId);
            const price = offer
              ? Math.floor(course.price * (100 - offer.discountPercentage) / 100 * 100) / 100
              : course.effectivePrice ?? course.price;
            totalPrice += price;
          }
        }

        return {
          name: path.title,
          totalPrice: Math.floor(totalPrice * 100) / 100,
        };
      })
    );

    return result;
  }

  async getEnrolledCourseIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]> {
    const filter = { userId };
    let enrollments;

    if (session) {
      enrollments = await this._enrollmentRepo.findAllWithSession(
        filter,
        session,
      );
    } else {
      enrollments = await this._enrollmentRepo.findAll(filter);
    }

    return (enrollments || []).map((e) => e.courseId);
  }

  async getEnrolledLearningPathIds(
    userId: Types.ObjectId,
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]> {
    const filter = { userId };
    let enrollments;

    if (session) {
      enrollments = await this._learningPathEnrollmentRepo.findAllWithSession(
        filter,
        session,
      );
    } else {
      enrollments = await this._learningPathEnrollmentRepo.findAll(filter);
    }

    return (enrollments || []).map((e) => e.learningPathId);
  }

  async getAllCourseIdsFromLearningPaths(
    learningPathIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<Types.ObjectId[]> {
    const filter = { _id: { $in: learningPathIds } };
    let paths;

    if (session) {
      paths = await this._learningPathRepo.findAllWithSession(filter, session);
    } else {
      paths = await this._learningPathRepo.findAll(filter);
    }

    return (paths || []).flatMap((p) =>
      p.items.map((item) =>
        item.courseId instanceof Types.ObjectId
          ? item.courseId
          : item.courseId._id
      )
    );
  }

  async findPendingOrderWithOverlappingCourses(
    userId: Types.ObjectId,
    purchasedCourseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null> {
    const filter = {
      userId,
      status: "PENDING",
      $or: [
        { "courses.courseId": { $in: purchasedCourseIds } },
        { "learningPaths.courses.courseId": { $in: purchasedCourseIds } },
      ],
    };

    if (session) {
      const orders = await this._orderRepo.findAllWithSession(filter, session);
      return orders && orders.length > 0 ? orders[0] : null;
    }

    const orders = await this._orderRepo.findAll(filter);
    return orders && orders.length > 0 ? orders[0] : null;
  }

  async getOrderByIdWithLock(
    orderId: Types.ObjectId,
    session: mongoose.ClientSession,
  ): Promise<IOrder | null> {
    return this._orderRepo.findByIdWithLock(orderId.toString(), session);
  }

  getCourseRepo(): ICourseRepository {
    return this._courseRepo;
  }

  getLearningPathRepo(): ILearningPathRepository {
    return this._learningPathRepo;
  }

  async getOrderById(orderId: Types.ObjectId): Promise<IOrder | null> {
    return this._orderRepo.findById(orderId.toString());
  }

  async markStalePendingOrdersAsFailed(
    userId: Types.ObjectId,
    purchasedCourseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<void> {
    const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
    const filter = {
      userId,
      status: "PENDING",
      createdAt: { $lte: staleThreshold },
      $or: [
        { "courses.courseId": { $in: purchasedCourseIds } },
        { "learningPaths.courses.courseId": { $in: purchasedCourseIds } },
      ],
    };

    if (session) {
      await this._orderRepo.updateManyWithSession(
        filter,
        { status: "FAILED" },
        session,
      );
    } else {
      await this._orderRepo.updateMany(filter, { status: "FAILED" });
    }
  }

  async getValidCourseOffers(
    courseIds: Types.ObjectId[],
    session?: mongoose.ClientSession,
  ): Promise<Map<string, ICourseOffer>> {
    const courseIdStrings = courseIds.map(id => id.toString());
    let offers: ICourseOffer[] = [];

    if (session) {
      offers = await this._courseOfferRepo.findValidOffersByCourseIds(courseIdStrings);
    } else {
      offers = await this._courseOfferRepo.findValidOffersByCourseIds(courseIdStrings);
    }

    return new Map<string, ICourseOffer>(
      offers.map((offer: ICourseOffer) => [offer.courseId.toString(), offer])
    );
  }
}