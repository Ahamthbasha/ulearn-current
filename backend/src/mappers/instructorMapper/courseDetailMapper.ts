import { CourseResponseDto } from "../../dto/instructorDTO/courseDetailsDTO";

export function mapToCourseResponseDto(course: any): CourseResponseDto {
  return {
    courseId: course._id.toString(),
    courseName: course.courseName,
    description: course.description,
    duration: course.duration,
    price: course.price,
    level: course.level,
    categoryName: course.category.categoryName,
    thumbnailSignedUrl: course.thumbnailSignedUrl || null,
    demoVideoUrlSigned: course.demoVideo?.urlSigned || null,
    isPublished: course.isPublished,
    isListed: course.isListed,
    isVerified: course.isVerified,
  };
}
