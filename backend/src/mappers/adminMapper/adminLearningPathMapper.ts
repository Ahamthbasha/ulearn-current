import { ILearningPath } from "../../models/learningPathModel";
import { LearningPathDTO, PopulatedCourse } from "../../dto/adminDTO/learningPathDTO";
import { formatDate } from "../../utils/dateFormat";
import {Types} from "mongoose"

export function mapLearningPathToDTO(learningPath: ILearningPath): LearningPathDTO {
  const items = learningPath.items
    .filter(item => item.courseId != null)
    .map((item) => {
      const course = item.courseId as PopulatedCourse;
      return {
        courseId: course._id.toString(),
        order: item.order,
        courseName: course.courseName || undefined,
        thumbnailUrl: course.thumbnailUrl || undefined,
        price: course.effectivePrice ?? course.price ?? 0,
        isVerified: course.isVerified ?? false,
      };
    });

  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.price !== undefined ? item.price : 0);
  }, 0);

  const instructorId = learningPath.instructorId;
  let instructorName: string | undefined;
  let instructorEmail: string | undefined;
  if (instructorId && typeof instructorId === "object" && "username" in instructorId) {
    instructorName = (instructorId as any).username;
    instructorEmail = (instructorId as any).email;
  }

  const category = learningPath.categoryDetails || learningPath.category;

  return {
    _id: learningPath._id.toString(),
    title: learningPath.title,
    description: learningPath.description,
    instructorId: typeof instructorId === "string" ? instructorId : instructorId._id.toString(),
    instructorName,
    instructorEmail,
    items,
    totalAmount,
    isPublished: learningPath.isPublished,
    createdAt: formatDate(learningPath.createdAt),
    updatedAt: formatDate(learningPath.updatedAt),
    status: learningPath.status,
    adminReview: learningPath.adminReview,
    thumbnailUrl: learningPath.thumbnailUrl,
    categoryId: category instanceof Types.ObjectId ? category.toString() : category._id.toString(),
    categoryName: category instanceof Types.ObjectId ? undefined : category.categoryName,
  };
}

export function mapLearningPathsToDTO(learningPaths: ILearningPath[]): LearningPathDTO[] {
  return learningPaths.map(mapLearningPathToDTO);
}