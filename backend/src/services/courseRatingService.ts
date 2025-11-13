// services/rating/CourseRatingService.ts
import { Types } from 'mongoose';
import { ICourseRatingRepository } from '../repositories/interfaces/ICourseRatingRepository';
import { ICourseRatingService } from './interface/ICourseRatingService';

export class CourseRatingService implements ICourseRatingService {
  private _ratingRepo: ICourseRatingRepository;

  constructor(ratingRepo: ICourseRatingRepository) {
    this._ratingRepo = ratingRepo;
  }

  async updateCourseRating(courseId: Types.ObjectId): Promise<void> {
    const { average, count } = await this._ratingRepo.getApprovedReviewStats(courseId);
    await this._ratingRepo.updateCourseRating(courseId, average, count); // Updated method name
  }
}