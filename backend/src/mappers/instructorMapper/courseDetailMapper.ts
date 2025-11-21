import { CourseResponseDto, ICourseWithSignedUrls } from "../../dto/instructorDTO/courseDetailsDTO";
import { formatDuration } from "../../utils/formatDuration";

function formatDateTo12Hour(date: Date): string {
  const istDateString = date.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const match = istDateString.match(/^(\d{2})\/(\d{2})\/(\d{4}),\s(\d{1,2}):(\d{2})\s(am|pm)$/i);
  
  if (match) {
    const [, day, month, year, hours, minutes, ampm] = match;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm.toUpperCase()}`;
  }
  const utcTime = date.getTime();
  const istOffset = 5.5 * 60 * 60 * 1000; 
  const istDate = new Date(utcTime + istOffset);

  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const year = istDate.getUTCFullYear();
  const hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
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
    durationFormatted: course.durationFormatted || formatDuration(course.duration),
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