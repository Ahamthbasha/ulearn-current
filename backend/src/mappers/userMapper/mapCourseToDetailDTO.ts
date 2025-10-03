// src/mappers/courseDetailMapper.ts
import { ICourse } from "../../models/courseModel";
import { CourseDetailDTO } from "../../dto/userDTO/courseDetailDTO";

export const mapCourseToDetailDTO = (
  course: ICourse,
  chapterCount: number,
  quizQuestionCount: number,
): CourseDetailDTO => {
  return {
    courseId: course._id.toString(),
    courseName: course.courseName,
    instructorName:
      typeof course.instructorId === "object" && course.instructorId !== null
        ? (course.instructorId as any).username || ""
        : "",
    categoryName:
      typeof course.category === "object" && course.category !== null
        ? (course.category as any).categoryName || ""
        : "",
    thumbnailUrl: course.thumbnailUrl,
    demoVideoUrl: course.demoVideo?.url || "",
    chapterCount,
    quizQuestionCount,
    duration: course.duration,
    description: course.description,
    level: course.level,
    price: course.price,
    originalPrice:course.originalPrice || course.price
  };
};
