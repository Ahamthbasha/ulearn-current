import { ICourse } from "../models/courseModel";
import { Types } from "mongoose";

export interface PopulatedCartCourse extends Omit<ICourse, "_id"> {
  _id: Types.ObjectId;
}
