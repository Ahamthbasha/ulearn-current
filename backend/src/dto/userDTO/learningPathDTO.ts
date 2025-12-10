export interface LearningPathListDTO {
  learningPathId: string;
  title: string;
  thumbnailUrl?: string;
  isPurchased:boolean
}

export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  studentId: string;
  items: Array<{
    courseId: string;
    order: number;
    courseName?: string;
    thumbnailUrl?: string;
    price?: number;
  }>;
  totalPrice: number;
  isPurchased: boolean;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  category: string;
  categoryName: string;
}