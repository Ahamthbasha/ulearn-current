import {Types} from "mongoose"

export interface ICourseRatingService {
    updateCourseRating(courseId: Types.ObjectId): Promise<void>
}