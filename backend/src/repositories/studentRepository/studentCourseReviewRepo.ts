import { GenericRepository } from "../genericRepository";
import {
  CourseReviewModel,
  ICourseReview,
} from "../../models/courseReviewModel";
import { IStudentCourseReviewRepo } from "./interface/IStudentCourseReviewRepo";
import { FilterQuery, Types } from "mongoose";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
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
    return await this.find({ studentId: new Types.ObjectId(studentId) }); // convert here
  }

  async getReviewByStudentForCourse(
    studentId: string,
    courseId: string
  ): Promise<ICourseReview | null> {
    return await this.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    }); // convert here
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

    // Optionally add other fields that are safe to filter on, e.g. rating, approved, flaggedByInstructor, etc.
    if (typeof filter.rating === "number") {
      filterQuery.rating = filter.rating;
    }

    if (typeof filter.approved === "boolean") {
      filterQuery.approved = filter.approved;
    }

    if (typeof filter.flaggedByInstructor === "boolean") {
      filterQuery.flaggedByInstructor = filter.flaggedByInstructor;
    }
    return this.model.findOne(filterQuery).exec();
  }

  async softDelete(reviewId: string): Promise<ICourseReview | null> {
    const objectId = new Types.ObjectId(reviewId);
    return await this.model
      .findByIdAndUpdate(objectId, { $set: { isDeleted: true } }, { new: true })
      .exec();
  }

  async getReviewsByCourse(courseId: string): Promise<PopulatedCourseReview[]> {
    const reviews = await this.model
      .find({
        courseId: new Types.ObjectId(courseId),
        isDeleted: false,
        approved: true,
      })
      .populate("studentId", "username profilePicUrl")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const updatedReviews: PopulatedCourseReview[] = await Promise.all(
      reviews.map(async (r) => {
        const student = r.studentId as {
          _id: Types.ObjectId;
          username?: string;
          profilePicUrl?: string;
        };

        let profileUrl: string | undefined;

        if (student?.profilePicUrl) {
          try {
            profileUrl = await getPresignedUrl(student.profilePicUrl);
          } catch {
            // leave undefined if presigned URL fails
            profileUrl = undefined;
          }
        }

        return {
          ...r,
          studentId: {
            _id: student._id,
            username: student.username || "Anonymous",
            profilePicUrl: profileUrl,
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
      })
      .populate("studentId", "username profilePicUrl")
      .lean()
      .exec();

    if (!review) return null;

    const student = review.studentId as {
      _id: Types.ObjectId;
      username?: string;
      profilePicUrl?: string;
    };

    let profileUrl: string | undefined;

    if (student?.profilePicUrl) {
      try {
        profileUrl = await getPresignedUrl(student.profilePicUrl);
      } catch {
        profileUrl = undefined;
      }
    }

    return {
      ...review,
      studentId: {
        _id: student._id,
        username: student.username || "Anonymous",
        profilePicUrl: profileUrl,
      },
    };
  }
}
