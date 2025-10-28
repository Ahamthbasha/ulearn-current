export interface EnrolledCourseDTO {
  courseId: string;
  thumbnailUrl: string;
  courseName: string;
  description: string;
  completionStatus: string;
  certificateGenerated: boolean;
  completionPercentage: number;
  price: number;
}
