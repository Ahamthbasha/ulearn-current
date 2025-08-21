export interface CourseResponseDto {
  courseId: string;
  courseName: string;
  description: string;
  duration: string;
  price: number;
  level: string;
  categoryName: string;
  thumbnailSignedUrl: string | null;
  demoVideoUrlSigned: string | null;
  isPublished: boolean;
  isListed: boolean;
  isVerified: boolean;
}
