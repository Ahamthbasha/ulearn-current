export interface ListInstructorParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "asc" | "desc"; // ✅ Add this
  skill?: string;
  expertise?: string;
}
