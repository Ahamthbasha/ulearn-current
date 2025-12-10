import { Document,Types } from "mongoose";
import { ICourse } from "../../models/courseModel";

export type PopulatedItem = {
  order: number;
  course: ICourse; // hydrated Mongoose document
};

export type EnrichedCourse = Omit<ICourse, keyof Document> & {
  _id:Types.ObjectId;
  order: number;
  thumbnailUrl: string;
  price: number;
  effectivePrice: number;
  certificateUrl?: string;
  completionPercentage?: number;
};