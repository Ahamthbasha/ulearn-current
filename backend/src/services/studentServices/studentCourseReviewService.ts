import { IStudentCourseReviewService } from "./interface/IStudentCourseReviewService";
import { IStudentCourseReviewRepo } from "../../repositories/studentRepository/interface/IStudentCourseReviewRepo"; 
import { ICourseReview } from "../../models/courseReviewModel";
import { Types } from "mongoose";
import { validateReview } from "../../utils/reviewValidation";
import { ICourseRatingService } from "../interface/ICourseRatingService";

export class StudentCourseReviewService implements IStudentCourseReviewService {
  private readonly _studentCourseReviewRepo: IStudentCourseReviewRepo;
  private readonly _courseRatingService:ICourseRatingService

  constructor(studentCourseReviewRepo: IStudentCourseReviewRepo,courseRatingService:ICourseRatingService) {
    this._studentCourseReviewRepo = studentCourseReviewRepo;

    this._courseRatingService = courseRatingService
  }

  async createReview(studentId: string, reviewData: { courseId: string; rating: number; reviewText: string },
    enrollment:{completionPercentage:number}
  ): Promise<ICourseReview> {
    if (enrollment.completionPercentage !== 100) {
      throw new Error("You must complete the course to leave a review.");
    }

    const error = validateReview(reviewData.rating, reviewData.reviewText);
    if (error) throw new Error(error);

    const existing = await this._studentCourseReviewRepo.getReviewByStudentForCourse(studentId, reviewData.courseId);
    
    if (existing && !existing.isDeleted) {
      throw new Error("You have already reviewed this course.");
    }

     if (existing && existing.isDeleted) {
      const updated = await this._studentCourseReviewRepo.updateReview(
        existing.id.toString(),
        {
          rating: reviewData.rating,
          reviewText: reviewData.reviewText,
          flaggedByInstructor: false,
          isDeleted: false,
          status: "approved",
          rejectionReason: null, 
        }
      );

      if (updated) {
        await this._courseRatingService.updateCourseRating(updated.courseId);
        return updated;
      }
      
      throw new Error("Failed to restore review.");
    }

    const toCreate: Partial<ICourseReview> = {
      ...reviewData,
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(reviewData.courseId),
      flaggedByInstructor: false,
      status:"approved",
      isDeleted:false,
      rejectionReason:null
    };
    
    const review = await this._studentCourseReviewRepo.createReview(toCreate);

    await this._courseRatingService.updateCourseRating(review.courseId);

    return review;
  }

  async updateReview(
    studentId: string,
    reviewId: string,
    updates: { rating?: number; reviewText?: string }
  ): Promise<ICourseReview | null> {
    const existing = await this._studentCourseReviewRepo.findOne({ _id: reviewId, studentId: new Types.ObjectId(studentId) });
    if (!existing || existing.isDeleted) throw new Error("Review not found.");

    const error = validateReview(updates.rating ?? existing.rating, updates.reviewText ?? existing.reviewText);
    if (error) throw new Error(error);

    const updated = await this._studentCourseReviewRepo.updateReview(reviewId, {
      ...updates,
      flaggedByInstructor: false,
      status:"approved"
    });

    await this._courseRatingService.updateCourseRating(existing.courseId);
    return updated;
  }

  async deleteReview(studentId: string, reviewId: string): Promise<ICourseReview | null> {
    const existing = await this._studentCourseReviewRepo.findOne({ _id: reviewId, studentId: new Types.ObjectId(studentId) });
    if (!existing|| existing.isDeleted) throw new Error("Review not found or not owned by student.");

    const deleted = await this._studentCourseReviewRepo.deleteReview(reviewId); // soft delete
    await this._courseRatingService.updateCourseRating(existing.courseId);
    return deleted;
  }

  async getMyReviews(studentId: string): Promise<ICourseReview[]> {
    return this._studentCourseReviewRepo.getReviewsByStudent(studentId);
  }

  async getMyReviewForCourse(studentId: string, courseId: string): Promise<ICourseReview | null> {
    return this._studentCourseReviewRepo.getReviewByStudentForCourse(studentId, courseId);
  }
}
