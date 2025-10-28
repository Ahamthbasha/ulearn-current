type ObjectId = string

export interface CourseDTO {
  _id: string;
  courseName: string;
}
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



export interface LearningPathListDTO {
  learningPathId: string;
  title: string;
  thumbnailUrl?: string;
}

export interface LearningPathItemDTO {
  courseId: string;
  order: number;
  courseName?: string;
  thumbnailUrl?: string;
  price?:number;
}

export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  studentId: string;
  items: LearningPathItemDTO[];
  totalAmount:number;
  totalPrice:number;
  isPublished: boolean;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?:string;
  category?:string;
  categoryName:string;
}

export interface CreateLearningPathRequest {
  title: string;
  description: string;
  items: Array<{ courseId: string; order: number }>;
  category: string;
  thumbnailUrl?: string;
}

export interface UpdateLearningPathRequest {
  title?: string;
  description?: string;
  items?: Array<{ courseId: string; order: number }>;
  category:string
  thumbnailUrl?: string;
}


export interface ICategoryModel {
  _id: ObjectId;
  categoryName: string;
  description?: string;
  isListed: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}