export interface LearningPathItem {
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
  instructorId: string;
  items: LearningPathItem[];
  totalAmount:number;
  isPublished: boolean;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLearningPathRequest {
  title: string;
  description: string;
  items: Array<{ courseId: string; order: number }>;
  publishDate?: string;
}

export interface UpdateLearningPathRequest {
  title?: string;
  description?: string;
  items?: Array<{ courseId: string; order: number }>;
  publishDate?: string;
}

export interface CourseDTO {
  courseId: string;
  courseName: string;
}