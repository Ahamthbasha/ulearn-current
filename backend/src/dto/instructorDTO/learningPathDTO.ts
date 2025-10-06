export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  instructorId: string;
  items: Array<{ courseId: string; order: number; courseName?: string; thumbnailUrl?: string,price?:number }>;
  totalAmount:number;
  isPublished: boolean;
  publishDate?: Date;
  createdAt: string;
  updatedAt: string;
}