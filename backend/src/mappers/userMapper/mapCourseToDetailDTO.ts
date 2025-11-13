import { ICourseFullyPopulated } from "../../models/courseModel";
import { CourseDetailDTO, IModuleDTO, IReviewDTO } from "../../dto/userDTO/courseDetailDTO";
import { parseDurationStringToSeconds } from "../../utils/parseDuration";
import { formatDuration } from "../../utils/formatDuration";

export const mapCourseToDetailDTO = (
  course: ICourseFullyPopulated,
  modules: IModuleDTO[],
  reviews:IReviewDTO[],
  totalEnrollments:number=0,
  completionPercentage?:number,
  isEnrolled:boolean = false,
  userReviewed:boolean = false
): CourseDetailDTO => {
  const instructorName = course.instructorId.username;
  const instructorId = course.instructorId._id.toString()
  const categoryName = course.category.categoryName;

  const totalSeconds = modules.reduce((sum, m) => {
    return sum + parseDurationStringToSeconds(m.duration);
  }, 0);

  return {
    courseId: course._id.toString(),
    courseName: course.courseName,
    instructorName,
    instructorId,
    categoryName,
    thumbnailUrl: course.thumbnailUrl,
    demoVideoUrl: course.demoVideo?.url ?? "",
    description: course.description,
    level: course.level,
    price: course.price,
    originalPrice: course.originalPrice ?? course.price,
    discountedPrice: course.discountedPrice,
    duration: formatDuration(totalSeconds),
    modules,
    reviews,
    averageRating:course.averageRating ?? 0,
    totalEnrollments,
    completionPercentage,
    isEnrolled,
    userReviewed
  };
};