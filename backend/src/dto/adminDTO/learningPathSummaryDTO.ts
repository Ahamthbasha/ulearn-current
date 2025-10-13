export interface LearningPathSummaryDTO {
  learningPathId: string;
  title: string;
  instructorName?: string;
  status: "pending" | "accepted" | "rejected" | "draft";
  TotalCourseInLearningPath: number;
  unverifiedCourseInLearningPath: number;
}