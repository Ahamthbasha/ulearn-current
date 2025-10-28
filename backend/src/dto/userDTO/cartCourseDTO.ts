export interface CartItemDTO {
  itemId: string;
  type: "course" | "learningPath";
  title: string;
  price: number;
  thumbnailUrl: string;
  isAlreadyEnrolled?: boolean;
  enrolledCourses?: string[];
}
