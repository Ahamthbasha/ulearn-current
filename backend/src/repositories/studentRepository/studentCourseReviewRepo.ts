import { GenericRepository } from "../genericRepository";
import {
  CourseReviewModel,
  ICourseReview,
} from "../../models/courseReviewModel";
import { IStudentCourseReviewRepo } from "./interface/IStudentCourseReviewRepo";
import { FilterQuery, Types } from "mongoose";
import { PopulatedCourseReview } from "../../interface/studentInterface/IPopulatedCourseReview";
export class StudentCourseReviewRepo
  extends GenericRepository<ICourseReview>
  implements IStudentCourseReviewRepo
{
  constructor() {
    super(CourseReviewModel);
  }

  async createReview(review: Partial<ICourseReview>): Promise<ICourseReview> {
    return await this.create(review);
  }

  async updateReview(
    reviewId: string,
    updates: Partial<ICourseReview>
  ): Promise<ICourseReview | null> {
    return await this.update(reviewId, updates);
  }

  async deleteReview(reviewId: string): Promise<ICourseReview | null> {
    return await this.delete(reviewId);
  }

  async getReviewsByStudent(studentId: string): Promise<ICourseReview[]> {
    return await this.find({ studentId: new Types.ObjectId(studentId) , status:"approved",isDeleted:false}); 
  }

  async getReviewByStudentForCourse(
    studentId: string,
    courseId: string
  ): Promise<ICourseReview | null> {
    return await this.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      status:"approved",
      isDeleted:false
    });
  }

  async findOne(filter: Partial<ICourseReview>): Promise<ICourseReview | null> {
    const filterQuery: FilterQuery<ICourseReview> = {};

    if (filter.studentId) {
      filterQuery.studentId =
        typeof filter.studentId === "string"
          ? new Types.ObjectId(filter.studentId)
          : filter.studentId;
    }

    if (filter.courseId) {
      filterQuery.courseId =
        typeof filter.courseId === "string"
          ? new Types.ObjectId(filter.courseId)
          : filter.courseId;
    }

    if (filter._id) {
      filterQuery._id =
        typeof filter._id === "string"
          ? new Types.ObjectId(filter._id)
          : filter._id;
    }

    if (typeof filter.rating === "number") {
      filterQuery.rating = filter.rating;
    }

    if (typeof filter.flaggedByInstructor === "boolean") {
      filterQuery.flaggedByInstructor = filter.flaggedByInstructor;
    }

    if (!filter.status) {
      filterQuery.status = "approved";
    }
    
    if (filter.isDeleted === undefined) {
      filterQuery.isDeleted = false;
    }

    return this.model.findOne(filterQuery).exec();
  }

  async getReviewsByCourse(courseId: string): Promise<PopulatedCourseReview[]> {
    const reviews = await this.model
      .find({
        courseId: new Types.ObjectId(courseId),
        status:"approved",
        isDeleted:false
      })
      .populate("studentId", "username ")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const updatedReviews: PopulatedCourseReview[] = await Promise.all(
      reviews.map(async (r) => {
        const student = r.studentId as {
          _id: Types.ObjectId;
          username?: string;
        };

        return {
          ...r,
          studentId: {
            _id: student._id,
            username: student.username || "Anonymous",
          },
        };
      })
    );

    return updatedReviews;
  }

  async getStudentReviewForCourse(
    courseId: string,
    studentId: string
  ): Promise<PopulatedCourseReview | null> {
    const review = await this.model
      .findOne({
        courseId: new Types.ObjectId(courseId),
        studentId: new Types.ObjectId(studentId),
        isDeleted: false,
        status:"approved"
      })
      .populate("studentId", "username")
      .lean()
      .exec();

    if (!review) return null;

    const student = review.studentId as {
      _id: Types.ObjectId;
      username?: string;
    };

    return {
      ...review,
      studentId: {
        _id: student._id,
        username: student.username || "Anonymous",
      },
    };
  }
}
