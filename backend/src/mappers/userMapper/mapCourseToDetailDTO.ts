import { ICourse } from "../../models/courseModel";
import { CourseDetailDTO, IPopulatedCategory, IPopulatedInstructor } from "../../dto/userDTO/courseDetailDTO";

export const mapCourseToDetailDTO = (
  course: ICourse,
  chapterCount: number,
  quizQuestionCount: number,
): CourseDetailDTO => {
  let instructorName = "";
  if (
    typeof course.instructorId === "object" &&
    course.instructorId !== null &&
    "username" in course.instructorId
  ) {
    instructorName = (course.instructorId as IPopulatedInstructor).username || "";
  }

  let categoryName = "";
  if (
    typeof course.category === "object" &&
    course.category !== null &&
    "categoryName" in course.category
  ) {
    categoryName = (course.category as IPopulatedCategory).categoryName || "";
  }

  return {
    courseId: course._id.toString(),
    courseName: course.courseName,
    instructorName,
    categoryName,
    thumbnailUrl: course.thumbnailUrl,
    demoVideoUrl: course.demoVideo?.url || "",
    chapterCount,
    quizQuestionCount,
    duration: course.duration,
    description: course.description,
    level: course.level,
    price: course.price,
    originalPrice: course.originalPrice || course.price,
    discountedPrice: course.discountedPrice,
  };
};