import {Types} from "mongoose"
import { IDemoVideo } from "../../models/courseModel";

export interface ICourseWithSignedUrls {
  _id: Types.ObjectId | string;
  courseName: string;
  description: string;
  duration: string;
  durationFormatted:string;
  price: number;
  level: string;
  category?: { categoryName: string } | string;
  categoryName?: string;
  thumbnailSignedUrl?: string | null;
  demoVideo?: IDemoVideo & { urlSigned?: string | null };
  isPublished: boolean;
  isListed: boolean;
  isVerified: boolean;
  isSubmitted: boolean;
  review?: string;
  publishDate?: Date | string;
}

export interface CourseResponseDto {
  courseId: string;
  courseName: string;
  description: string;
  duration: string;
  durationFormatted:string;
  price: number;
  level: string;
  categoryName: string;
  thumbnailSignedUrl: string | null;
  demoVideoUrlSigned: string | null;
  isPublished: boolean;
  isListed: boolean;
  isVerified: boolean;
  isSubmitted: boolean;
  review: string;
  publishDate?: string;
}
