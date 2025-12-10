export interface GetReviewsParams {
  courseId: string;
  page?: number;
  limit?: number;
  status?:"all" | "pending" | "approved" | "rejected" | "deleted";
  search?:string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  studentName: string;
  studentAvatar?: string;
  createdAt: string;
  flagged: boolean;
  approved: boolean;
}

export interface PaginatedReviews {
  data: Review[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FlagReviewResponse {
  success: boolean;
  message: string;
}
