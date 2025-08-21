// mappers/course.mapper.ts
import { ICourse } from "../../models/courseModel";
import { InstructorCourseDTO } from "../../dto/instructorDTO/instructorCourseDTO";

export function mapCourseToInstructorDTO(course: ICourse & { category?: { categoryName: string } }): InstructorCourseDTO {
  return {
    courseId: course._id.toString(),
    courseName: course.courseName,
    thumbnailUrl: course.thumbnailUrl,
    category: course.category && typeof course.category === "object"
      ? course.category.categoryName
      : "",
    status: course.isPublished,
  };
}

export function mapCoursesToInstructorDTOs(courses: (ICourse & { category?: { categoryName: string } })[]): InstructorCourseDTO[] {
  return courses.map(mapCourseToInstructorDTO);
}
