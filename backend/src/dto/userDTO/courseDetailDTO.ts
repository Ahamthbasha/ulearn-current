export interface CourseDetailDTO {
  courseId: string;
  courseName: string;
  instructorName: string;
  categoryName: string;
  thumbnailUrl: string;
  demoVideoUrl: string;
  chapterCount: number;
  quizQuestionCount: number;
  duration: string;
  description: string;
  level: string;
  price: number;
  originalPrice:number;
  discountedPrice?:number;
}
