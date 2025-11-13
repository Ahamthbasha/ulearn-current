import { ICourseReview } from "src/models/courseReviewModel";
import {Types} from "mongoose"
export interface PopulatedCourseReview
  extends Omit<ICourseReview, "studentId"> {
  studentId: {
    _id: Types.ObjectId;
    username: string;
    profilePicUrl?: string;
  };
}
