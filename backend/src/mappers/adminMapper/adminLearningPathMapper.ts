import { ILearningPath } from "../../models/learningPathModel";
import { LearningPathDTO } from "../../dto/adminDTO/learningPathDTO";
import { formatDate } from "../../utils/dateFormat";
import { Types } from "mongoose";

interface PopulatedCourse {
  _id: Types.ObjectId;
  courseName?: string;
  thumbnailUrl?: string;
  price?: number;
  effectivePrice?: number;
  isVerified?: boolean;
}

export function mapLearningPathToDTO(learningPath: ILearningPath): LearningPathDTO {
  const items = learningPath.items
    .filter(item => item.courseId != null) // Ensure no null courseId
    .map((item) => {
      const course = item.courseId as PopulatedCourse; // Treat courseId as populated course object
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

  if (instructorId && typeof instructorId === "object" && "username" in instructorId) {
    instructorName = (instructorId as any).username;
  }

  return {
    _id: learningPath._id.toString(),
    title: learningPath.title,
    description: learningPath.description,
    instructorId: typeof instructorId === "string" ? instructorId : instructorId._id.toString(),
    instructorName,
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