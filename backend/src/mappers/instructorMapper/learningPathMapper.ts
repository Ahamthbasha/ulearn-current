import { ILearningPath } from "../../models/learningPathModel";
import { LearningPathDTO } from "../../dto/instructorDTO/learningPathDTO";
import { formatDate } from "../../utils/dateFormat";

export function mapLearningPathToDTO(learningPath: ILearningPath): LearningPathDTO {
  const items = learningPath.items.map((item) => {
    const isPopulated = item.courseId && typeof item.courseId === "object" && "_id" in item.courseId;
    return {
      courseId: isPopulated
        ? (item.courseId as any)._id.toString()
        : item.courseId.toString(),
      order: item.order,
      courseName: isPopulated ? (item.courseId as any)?.courseName : undefined,
      thumbnailUrl: isPopulated ? (item.courseId as any)?.thumbnailUrl : undefined,
      price: isPopulated ? (item.courseId as any)?.effectivePrice ?? (item.courseId as any)?.price : undefined,
    };
  });

  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.price !== undefined ? item.price : 0);
  }, 0);

  return {
    _id: learningPath._id.toString(),
    title: learningPath.title,
    description: learningPath.description,
    instructorId: learningPath.instructorId.toString(),
    items,
    totalAmount,
    isPublished: learningPath.isPublished,
    createdAt: formatDate(learningPath.createdAt),
    updatedAt: formatDate(learningPath.updatedAt),
    status: learningPath.status,
    adminReview: learningPath.adminReview,
  };
}

export function mapLearningPathsToDTO(learningPaths: ILearningPath[]): LearningPathDTO[] {
  return learningPaths.map(mapLearningPathToDTO);
}