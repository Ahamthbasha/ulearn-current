import { Types } from "mongoose";
import { ILearningPath } from "../../models/learningPathModel";
import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
import {
  LearningPathDTO,
  LearningPathDetailsDTO,
  CourseDetailsDTO,
} from "../../dto/userDTO/lmsEnrollDTO";
import { ICourse } from "../../models/courseModel";
import { isPresignedUrl } from "../../utils/isPresignedUrl";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { IOrderRepository } from "../../repositories/interfaces/IOrderRepository";

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
  const presignedThumbnailUrl =
    learningPath.thumbnailUrl && !isPresignedUrl(learningPath.thumbnailUrl)
      ? await getPresignedUrl(learningPath.thumbnailUrl)
      : (learningPath.thumbnailUrl ?? "");

  // Fetch totalPrice from OrderModel
  const order = await orderRepository.findByUserAndLearningPath(
    userId,
    learningPath._id,
  );
  const learningPathOrder = order?.learningPaths.find((lp) =>
    lp.learningPathId.equals(learningPath._id),
  );
  const totalPrice = learningPathOrder?.totalPrice ?? 0;

  return {
    id: learningPath._id.toString(),
    title: learningPath.title,
    totalPrice,
    description: learningPath.description,
    noOfCourses: learningPath.noOfCourses ?? learningPath.items?.length ?? 0,
    noOfHours: learningPath.noOfHours ?? 0,
    presignedThumbnailUrl,
    learningPathCompleted: enrollment.completionStatus === "COMPLETED",
    totalCompletionPercentageOfLearningPath:
      learningPath.totalCompletionPercentageOfLearningPath ?? 0,
  };
};

export const mapToLearningPathDetailsDTO = async (
  learningPath: ILearningPath,
  enrollment: ILearningPathEnrollment,
  courses: Array<
    ICourse & { certificateUrl?: string; completionPercentage?: number }
  >,
  orderRepository: IOrderRepository,
  userId: Types.ObjectId,
  getPresignedUrlFn: (url: string) => Promise<string> = getPresignedUrl,
): Promise<LearningPathDetailsDTO> => {
  // Fetch totalPrice from OrderModel
  const order = await orderRepository.findByUserAndLearningPath(
    userId,
    learningPath._id,
  );
  const learningPathOrder = order?.learningPaths.find((lp) =>
    lp.learningPathId.equals(learningPath._id),
  );
  const totalPrice = learningPathOrder?.totalPrice ?? 0;

  const courseDetails: CourseDetailsDTO[] = await Promise.all(
    learningPath.items.map(async (item) => {
      const course = courses.find((c) =>
        c._id.equals(
          item.courseId instanceof Types.ObjectId
            ? item.courseId
            : item.courseId._id,
        ),
      );
      if (!course) {
        throw new Error(`Course not found for courseId: ${item.courseId}`);
      }

      const presignedThumbnailUrl =
        course.thumbnailUrl && !isPresignedUrl(course.thumbnailUrl)
          ? await getPresignedUrlFn(course.thumbnailUrl)
          : (course.thumbnailUrl ?? "");

      const isCompleted = enrollment.completedCourses.some(
        (cc) => cc.courseId.equals(course._id) && cc.isCompleted,
      );

      // Fetch coursePrice from OrderModel
      const courseOrder = learningPathOrder?.courses.find((c) =>
        c.courseId.equals(course._id),
      );
      const coursePrice = courseOrder?.coursePrice ?? course.price;
      const effectivePrice =
        courseOrder?.offerPrice ?? course.effectivePrice ?? coursePrice;

      return {
        courseId: course._id.toString(),
        order: item.order,
        courseName: course.courseName,
        description: course.description,
        price: coursePrice,
        effectivePrice, // Include effectivePrice in the DTO
        thumbnailUrl: presignedThumbnailUrl,
        isCompleted,
        certificateUrl: course.certificateUrl,
        completionPercentage: course.completionPercentage ?? 0,
      };
    }),
  );

  const unlockedCourses = learningPath.items
    .filter((item) => item.order <= enrollment.unlockedOrder)
    .map((item) =>
      (item.courseId instanceof Types.ObjectId
        ? item.courseId
        : item.courseId._id
      ).toString(),
    );

  return {
    learningPathId: learningPath._id.toString(),
    totalPrice,
    courses: courseDetails,
    unlockedCourses,
    enrollment,
  };
};
