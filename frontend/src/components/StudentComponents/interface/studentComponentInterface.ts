export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice:number;
  duration: string;
  level: string;
  thumbnailUrl: string;
  categoryName?: string;
}

export interface CartItem {
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  price: number;
}