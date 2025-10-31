import {Types} from "mongoose"
export interface IPopulatedInstructor {
  _id: Types.ObjectId | string;
  username: string;
  email?: string;
}

export interface IPopulatedCategory {
  _id: Types.ObjectId |string;
  categoryName: string;
}

export interface CourseDetailDTO {
  courseId: string;
  courseName: string;
  instructorName: string;
  categoryName: string;
  thumbnailUrl: string;
  demoVideoUrl: string;
  chapterCount: number;
  quizQuestionCount: number;
  duration: string;
  description: string;
  level: string;
  price: number;
  originalPrice: number;
  discountedPrice?: number;
}
