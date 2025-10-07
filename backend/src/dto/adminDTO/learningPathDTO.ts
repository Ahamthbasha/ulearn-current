// src/dto/adminDTO/learningPathDTO.ts
export interface LearningPathItemDTO {
  courseId: string;
  order: number;
  courseName?: string;
  thumbnailUrl?: string;
  price?: number;
  isVerified?: boolean; // Added to include course verification status
}

export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName?: string; // Added to store instructor's username
  items: LearningPathItemDTO[];
  totalAmount: number;
  isPublished: boolean;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "accepted" | "rejected" | "draft";
  adminReview?: string;
}