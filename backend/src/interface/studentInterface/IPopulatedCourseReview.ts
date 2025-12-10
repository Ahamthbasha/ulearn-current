import { ICourseReview } from "../../models/courseReviewModel";
import {Types} from "mongoose"
export interface PopulatedCourseReview
  extends Omit<ICourseReview, "studentId"> {
  studentId: {
    _id: Types.ObjectId;
    username: string;
  };
}
