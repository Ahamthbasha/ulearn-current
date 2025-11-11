import { IStudentCourseReviewService } from "./interface/IStudentCourseReviewService";
import { IStudentCourseReviewRepo } from "../../repositories/studentRepository/interface/IStudentCourseReviewRepo"; 
import { ICourseReview } from "../../models/courseReviewModel";
import { Types } from "mongoose";

export class StudentCourseReviewService implements IStudentCourseReviewService {
  private readonly _studentCourseReviewRepo: IStudentCourseReviewRepo;

  constructor(studentCourseReviewRepo: IStudentCourseReviewRepo) {
    this._studentCourseReviewRepo = studentCourseReviewRepo;
  }

  async createReview(studentId: string, reviewData: { courseId: string; rating: number; reviewText: string }): Promise<ICourseReview> {
    const existing = await this._studentCourseReviewRepo.getReviewByStudentForCourse(studentId, reviewData.courseId);
    if (existing) {
      throw new Error("Review for this course by this student already exists.");
    }

    const toCreate: Partial<ICourseReview> = {
      ...reviewData,
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(reviewData.courseId),
      approved: false, // default to pending approval
      flaggedByInstructor: false,
    };

    return this._studentCourseReviewRepo.createReview(toCreate);
  }

  async updateReview(studentId: string, reviewId: string, updates: Partial<ICourseReview>): Promise<ICourseReview | null> {
    // Ensure student owns the review
    const existing = await this._studentCourseReviewRepo.findOne({ _id: reviewId, studentId: new Types.ObjectId(studentId) });
    if (!existing) throw new Error("Review not found or not owned by student.");

    // Reset moderation flags on update
    updates.approved = false;
    updates.flaggedByInstructor = false;

    return this._studentCourseReviewRepo.updateReview(reviewId, updates);
  }

  async deleteReview(studentId: string, reviewId: string): Promise<ICourseReview | null> {
    // Ensure student owns the review
    const existing = await this._studentCourseReviewRepo.findOne({ _id: reviewId, studentId: new Types.ObjectId(studentId) });
    if (!existing) throw new Error("Review not found or not owned by student.");

    return this._studentCourseReviewRepo.deleteReview(reviewId);
  }

  async getMyReviews(studentId: string): Promise<ICourseReview[]> {
    return this._studentCourseReviewRepo.getReviewsByStudent(studentId);
  }

  async getMyReviewForCourse(studentId: string, courseId: string): Promise<ICourseReview | null> {
    return this._studentCourseReviewRepo.getReviewByStudentForCourse(studentId, courseId);
  }
}
