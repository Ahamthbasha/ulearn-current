import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";

export interface LearningPathDTO {
  id: string;
  title: string;
  totalPrice: number;
  description: string;
  noOfCourses: number;
  noOfHours: number;
  presignedThumbnailUrl: string;
  learningPathCompleted: boolean;
  totalCompletionPercentageOfLearningPath: number;
}

export interface CourseDetailsDTO {
  courseId: string;
  order: number;
  courseName: string;
  description: string;
  price: number;
  effectivePrice: number; // Added to include effectivePrice
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