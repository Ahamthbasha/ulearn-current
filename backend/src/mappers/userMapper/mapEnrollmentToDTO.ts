import { IEnrollment } from "../../models/enrollmentModel";
import { IOrder } from "../../models/orderModel";
import { EnrolledCourseDTO } from "../../dto/userDTO/enrollmentCourseDTO";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { ICourse } from "../../models/courseModel";
import { appLogger } from "../../utils/logger";
import { formatDuration } from "../../utils/formatDuration";

export const mapEnrollmentToDTO = async (
  enrollment: IEnrollment,
  order?: IOrder,
  course?: ICourse,
): Promise<EnrolledCourseDTO | null> => {
  if (!course) {
    appLogger.warn(`Course not found for ID: ${enrollment.courseId}`);
    return null;
  }

  const orderCourse = order?.courses.find(
    (c) => c.courseId.toString() === enrollment.courseId.toString(),
  );
  const price =
    orderCourse?.offerPrice !== undefined &&
    orderCourse.offerPrice < orderCourse.coursePrice
      ? orderCourse.offerPrice
      : (orderCourse?.coursePrice ?? course.price);

  const thumbnailUrl = course.thumbnailUrl
    ? await getPresignedUrl(course.thumbnailUrl)
    : "";

  return {
    courseId: enrollment.courseId.toString(),
    thumbnailUrl,
    courseName: course.courseName,
    description: course.description,
    duration:formatDuration(course.duration),
    completionStatus: enrollment.completionStatus,
    certificateGenerated: enrollment.certificateGenerated,
    completionPercentage: enrollment.completionPercentage,
    price,
  };
};
