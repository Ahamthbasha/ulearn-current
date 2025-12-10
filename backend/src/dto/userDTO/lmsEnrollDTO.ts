import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";

export interface LearningPathDTO {
  id: string;
  title: string;
  totalPrice: number;
  description: string;
  noOfCourses: number;
  noOfHours: number | string;
  presignedThumbnailUrl: string;
  learningPathCompleted: boolean;
  totalCompletionPercentageOfLearningPath: number;
}

export interface CourseDetailsDTO {
  courseId: string;
  order: number;
  courseName: string;
  description: string;
  duration:string;
  price: number;
  effectivePrice: number;
  thumbnailUrl: string;
  isCompleted: boolean;
  certificateUrl?: string;
  completionPercentage: number;
}

export interface LearningPathDetailsDTO {
  learningPathId: string;
  totalPrice: number;
  courses: CourseDetailsDTO[];
  unlockedCourses: string[];
  enrollment: ILearningPathEnrollment;
}
