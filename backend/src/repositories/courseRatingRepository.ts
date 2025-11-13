import { ICourseRatingRepository } from './interfaces/ICourseRatingRepository';
import { CourseReviewModel } from '../models/courseReviewModel';
import { Types } from 'mongoose';
import { GenericRepository } from './genericRepository';
import { ICourseReview } from '../models/courseReviewModel';
import { ICourse } from '../models/courseModel';
import { ICourseRepository } from './interfaces/ICourseRepository';

interface AggregationResult {
  total: number;
  count: number;
}

export class CourseRatingRepository
  extends GenericRepository<ICourseReview>
  implements ICourseRatingRepository
{
  private _courseRepo: ICourseRepository;
  
  constructor(courseRepo: ICourseRepository) {
    super(CourseReviewModel);
    this._courseRepo = courseRepo;
  }

  async getApprovedReviewStats(courseId: Types.ObjectId): Promise<{ average: number; count: number }> {
    const pipeline = [
      {
        $match: {
          courseId,
          approved: true,
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$rating' },
          count: { $sum: 1 },
        },
      },
    ];

    const result = await this.aggregate<AggregationResult>(pipeline);

    if (!result.length || result[0].count === 0) {
      return { average: 0, count: 0 };
    }

    const { total, count } = result[0];
    const average = Number((total / count).toFixed(2));

    return { average, count };
  }

  async updateCourseRating(courseId: Types.ObjectId, average: number, count: number): Promise<void> {
    const updateData: Partial<ICourse> = {
      averageRating: average,
      totalRatings: count,
    };

    await this._courseRepo.updateById(courseId.toHexString(), updateData);
  }
}