import { CourseResponseDto, ICourseWithSignedUrls } from "../../dto/instructorDTO/courseDetailsDTO";
import { formatDuration } from "../../utils/formatDuration";

function formatDateTo12Hour(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${day}-${month}-${year} ${hours12}:${minutes} ${ampm}`;
}

export function mapToCourseResponseDto(course: ICourseWithSignedUrls): CourseResponseDto {
  return {
    courseId: course._id.toString(),
    courseName: course.courseName,
    description: course.description,
    duration: course.duration,
    durationFormatted:course.durationFormatted || formatDuration(course.duration),
    price: course.price,
    level: course.level,
   categoryName:
      typeof course.category === "string"
        ? course.category
        : course.category?.categoryName || course.categoryName || "",
    thumbnailSignedUrl: course.thumbnailSignedUrl || null,
    demoVideoUrlSigned: course.demoVideo?.urlSigned || null,
    isPublished: course.isPublished,
    isListed: course.isListed,
    isVerified: course.isVerified,
    isSubmitted: course.isSubmitted,
    review: course.review || "",
    publishDate: course.publishDate
      ? formatDateTo12Hour(new Date(course.publishDate))
      : undefined,
  };
}