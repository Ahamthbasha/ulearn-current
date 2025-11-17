import { ReviewDTO } from "../dto/instructorDTO/reviewDTO";

export interface IPaginationResultReview<T = ReviewDTO>{
  data:T[];
  total:number;
  page?:number;
  limit?:number;
}

export interface IPaginationResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}
