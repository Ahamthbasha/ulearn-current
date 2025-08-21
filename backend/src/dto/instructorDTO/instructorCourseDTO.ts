// dtos/course.dto.ts
export interface InstructorCourseDTO {
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  category: string; // category name
  status: boolean;  // isPublished
}
