export interface LearningPathListDTO {
  learningPathId: string;
  title: string;
  thumbnailUrl?: string;
}

export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  studentId: string; // Changed from instructorId
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