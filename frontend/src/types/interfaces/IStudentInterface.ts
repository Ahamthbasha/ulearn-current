export interface GetLMSCoursesParams {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
  sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc";
}


export interface CartItemDTO {
  itemId: string;
  type: "course" | "learningPath";
  title: string;
  price: number;
  thumbnailUrl: string;
  isAlreadyEnrolled?: boolean;
  enrolledCourses?: string[];
}

export interface WishlistItem {
  itemId: string;
  name: string;
  price: number;
  thumbnailUrl: string;
  type: "course" | "learningPath";
}