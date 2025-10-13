import { ILearningPath } from "../../models/learningPathModel";
import { LearningPathSummaryDTO } from "../../dto/adminDTO/learningPathSummaryDTO";

interface AggregatedLearningPath extends ILearningPath {
  TotalCourseInLearningPath?: number;
  unverifiedCourseInLearningPath?: number;
}

export function mapLearningPathToSummaryDTO(learningPath: ILearningPath): LearningPathSummaryDTO {
  const aggregatedPath = learningPath as AggregatedLearningPath;
  const instructorId = aggregatedPath.instructorId;
  let instructorName: string | undefined;
  if (instructorId && typeof instructorId === "object" && "username" in instructorId) {
    instructorName = (instructorId as any).username;
  }

  return {
    learningPathId: aggregatedPath._id.toString(),
    title: aggregatedPath.title,
    instructorName,
    status: aggregatedPath.status,
    TotalCourseInLearningPath: aggregatedPath.TotalCourseInLearningPath || aggregatedPath.items.length,
    unverifiedCourseInLearningPath: aggregatedPath.unverifiedCourseInLearningPath || aggregatedPath.items.filter((item: any) => !(item.courseId as any)?.isVerified).length,
  };
}

export function mapLearningPathsToSummaryDTO(learningPaths: ILearningPath[]): LearningPathSummaryDTO[] {
  return learningPaths.map(mapLearningPathToSummaryDTO);
}