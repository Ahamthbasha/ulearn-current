export interface LearningPathItemDTO {
  courseId: string;
  order: number;
  courseName?: string;
  thumbnailUrl?: string;
  price?:number;
}

export interface LearningPathListDTO {
  learningPathId: string;
  title: string;
  thumbnailUrl?: string;
  status: "pending" | "accepted" | "rejected" | "draft";
}

export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  instructorId: string;
  items: LearningPathItemDTO[];
  totalAmount:number;
  totalPrice:number;
  isPublished: boolean;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "pending" | "accepted" | "rejected"; 
  adminReview?: string;
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

export interface CourseDTO {
  courseId: string;
  courseName: string;
}


export interface ICourseOffer {
  _id: string;
  courseId: {
    _id: string;
    courseName: string;
    id?: string;
  };
  discountPercentage: number;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  discountedPrice?: number | null;
  id?: string;
}