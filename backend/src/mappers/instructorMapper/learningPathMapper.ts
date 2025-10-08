import { ICourse } from "../../models/courseModel";
import { ILearningPath } from "../../models/learningPathModel";
import { LearningPathListDTO, LearningPathDTO } from "src/dto/instructorDTO/learningPathDTO";
import { formatDate } from "../../utils/dateFormat";
import { Types } from "mongoose";

export function mapLearningPathToListDTO(learningPath: ILearningPath): LearningPathListDTO {
  return {
    learningPathId: learningPath._id.toString(),
    title: learningPath.title,
    thumbnailUrl: learningPath.thumbnailUrl,
    status: learningPath.status,
  };
}

export function mapLearningPathsToListDTO(learningPaths: ILearningPath[]): LearningPathListDTO[] {
  return learningPaths.map(mapLearningPathToListDTO);
}

export function mapLearningPathToDTO(learningPath: ILearningPath): LearningPathDTO {
  const items = learningPath.items.map((item) => {
    const isPopulated = item.courseId && item.courseId instanceof Object && "_id" in item.courseId;

    return {
      courseId: isPopulated
        ? (item.courseId as ICourse)._id.toString()
        : (item.courseId as Types.ObjectId).toString(),
      order: item.order,
      courseName: isPopulated ? (item.courseId as ICourse).courseName : undefined,
      thumbnailUrl: isPopulated ? (item.courseId as ICourse).thumbnailUrl : undefined,
      price: isPopulated ? ((item.courseId as ICourse).effectivePrice ?? (item.courseId as ICourse).price) : undefined,
    };
  });

  return {
    _id: learningPath._id.toString(),
    title: learningPath.title,
    description: learningPath.description,
    instructorId: learningPath.instructorId.toString(),
    items,
    totalPrice: learningPath.totalPrice,
    isPublished: learningPath.isPublished,
    publishDate: learningPath.isPublished ? learningPath.updatedAt : undefined,
    createdAt: formatDate(learningPath.createdAt),
    updatedAt: formatDate(learningPath.updatedAt),
    status: learningPath.status,
    adminReview: learningPath.adminReview,
    thumbnailUrl: learningPath.thumbnailUrl,
    category: learningPath.category!.toString(),
    categoryName: learningPath.categoryDetails?.categoryName ?? ""
  };
}

export function mapLearningPathsToDTO(learningPaths: ILearningPath[]): LearningPathDTO[] {
  return learningPaths.map(mapLearningPathToDTO);
}
