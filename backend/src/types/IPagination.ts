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
}