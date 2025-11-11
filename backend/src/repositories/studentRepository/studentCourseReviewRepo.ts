import { GenericRepository } from "../genericRepository";
import { CourseReviewModel, ICourseReview } from "../../models/courseReviewModel";
import { IStudentCourseReviewRepo } from "./interface/IStudentCourseReviewRepo";
import { FilterQuery, Types } from "mongoose";

export class StudentCourseReviewRepo extends GenericRepository<ICourseReview> implements IStudentCourseReviewRepo {
  constructor() {
    super(CourseReviewModel);
  }

  async createReview(review: Partial<ICourseReview>): Promise<ICourseReview> {
    return await this.create(review);
  }

  async updateReview(reviewId: string, updates: Partial<ICourseReview>): Promise<ICourseReview | null> {
    return await this.update(reviewId, updates);
  }

  async deleteReview(reviewId: string): Promise<ICourseReview | null> {
    return await this.delete(reviewId);
  }

  async getReviewsByStudent(studentId: string): Promise<ICourseReview[]> {
    return await this.find({ studentId: new Types.ObjectId(studentId) }); // convert here
  }

  async getReviewByStudentForCourse(studentId: string, courseId: string): Promise<ICourseReview | null> {
    return await this.findOne({ studentId: new Types.ObjectId(studentId), courseId: new Types.ObjectId(courseId) }); // convert here
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
      typeof filter._id === "string" ? new Types.ObjectId(filter._id) : filter._id;
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

}
