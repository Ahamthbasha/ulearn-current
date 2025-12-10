export interface LearningPathListDTO {
  learningPathId: string;
  title: string;
  thumbnailUrl?: string;
}

export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  items: Array<{
    courseId: string;
    order: number;
    courseName?: string;
    thumbnailUrl?: string;
    price?: number;
  }>;
  totalPrice: number;
  isPublished: boolean;
  publishDate?: Date;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  category: string;
  categoryName: string;
}
