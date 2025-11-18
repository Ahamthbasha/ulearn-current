import { Types } from "mongoose";
import { ILearningPath } from "../../models/learningPathModel";
import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
import {
  LearningPathDTO,
  LearningPathDetailsDTO,
  CourseDetailsDTO,
} from "../../dto/userDTO/lmsEnrollDTO";
import { EnrichedCourse } from "../../interface/studentInterface/ILmsDetailInterface";
import { IOrderRepository } from "../../repositories/interfaces/IOrderRepository";
import { formatDuration } from "../../utils/formatDuration";

export const mapToLearningPathDTO = async (
  learningPath: ILearningPath & {
    noOfCourses?: number;
    noOfHours?: number;
    totalCompletionPercentageOfLearningPath?: number;
  },
  enrollment: ILearningPathEnrollment,
  orderRepository: IOrderRepository,
  userId: Types.ObjectId,
): Promise<LearningPathDTO> => {
  const order = await orderRepository.findByUserAndLearningPath(userId, learningPath._id);
  const lpOrder = order?.learningPaths.find((lp) => lp.learningPathId.equals(learningPath._id));
  const totalPrice = lpOrder?.totalPrice ?? 0;

  return {
    id: learningPath._id.toString(),
    title: learningPath.title,
    totalPrice,
    description: learningPath.description,
    noOfCourses: learningPath.noOfCourses ?? learningPath.items?.length ?? 0,
    noOfHours: formatDuration(learningPath.noOfHours || "") ?? 0,
    presignedThumbnailUrl: learningPath.thumbnailUrl ?? "",
    learningPathCompleted: enrollment.completionStatus === "COMPLETED",
    totalCompletionPercentageOfLearningPath:
      learningPath.totalCompletionPercentageOfLearningPath ?? 0,
  };
};

export const mapToLearningPathDetailsDTO = async (
  learningPath: ILearningPath & { thumbnailUrl: string; totalPrice: number },
  enrollment: ILearningPathEnrollment,
  courses: EnrichedCourse[],
  orderRepository: IOrderRepository,
  userId: Types.ObjectId,
): Promise<LearningPathDetailsDTO> => {
  const order = await orderRepository.findByUserAndLearningPath(userId, learningPath._id);
  const lpOrder = order?.learningPaths.find((lp) => lp.learningPathId.equals(learningPath._id));
  const totalPrice = lpOrder?.totalPrice ?? learningPath.totalPrice;

  const courseDetails: CourseDetailsDTO[] = courses.map((course) => {
    const orderItem = lpOrder?.courses.find((c) => c.courseId.equals(course._id));
    const price = orderItem?.coursePrice ?? course.price;
    const effectivePrice = orderItem?.offerPrice ?? course.effectivePrice ?? price;

    const isCompleted = enrollment.completedCourses.some(
      (cc) => cc.courseId.equals(course._id) && cc.isCompleted,
    );

    return {
      courseId: course._id.toString(),
      order: course.order,
      courseName: course.courseName,
      description: course.description ?? "",
      duration:formatDuration(course.duration),
      price,
      effectivePrice,
      thumbnailUrl: course.thumbnailUrl,
      isCompleted,
      certificateUrl: course.certificateUrl,
      completionPercentage: course.completionPercentage ?? 0,
    };
  });

  const unlockedCourses = (enrollment.unlockedCourses || []).map((id) => id.toString());

  return {
    learningPathId: learningPath._id.toString(),
    totalPrice,
    courses: courseDetails,
    unlockedCourses,
    enrollment,
  };
};