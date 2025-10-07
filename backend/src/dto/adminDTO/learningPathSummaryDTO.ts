export interface LearningPathSummaryDTO {
  learningPathId: string;
  title: string;
  instructorName?: string;
  status: "pending" | "accepted" | "rejected" | "draft";
  LearningPathCourse: number; // Total number of courses
  UnverifiedCourses: number; // Count of unverified courses
}