export interface GetLMSCoursesParams {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
  sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc";
}
