import { ILearningPath } from "../../models/learningPathModel";
import { LearningPathSummaryDTO } from "../../dto/adminDTO/learningPathSummaryDTO";

export function mapLearningPathToSummaryDTO(learningPath: ILearningPath): LearningPathSummaryDTO {
  const items = learningPath.items.filter(item => item.courseId != null);
  const totalCourses = items.length;
  const unverifiedCourses = items.filter(item => {
    const course = item.courseId as any;
    return course && typeof course === "object" && !course.isVerified;
  }).length;

  const instructorId = learningPath.instructorId;
  let instructorName: string | undefined;

  if (instructorId && typeof instructorId === "object" && "username" in instructorId) {
    instructorName = (instructorId as any).username;
  }

  return {
    learningPathId: learningPath._id.toString(),
    title: learningPath.title,
    instructorName,
    status: learningPath.status,
    LearningPathCourse: totalCourses,
    UnverifiedCourses: unverifiedCourses,
  };
}

export function mapLearningPathsToSummaryDTO(learningPaths: ILearningPath[]): LearningPathSummaryDTO[] {
  return learningPaths.map(mapLearningPathToSummaryDTO);
}