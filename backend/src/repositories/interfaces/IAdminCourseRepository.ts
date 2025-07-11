import { ICourse } from "../../models/courseModel";

export interface IAdminCourseRepository {
  getAllCourses(search?: string, page?: number, limit?: number): Promise<{ data: ICourse[]; total: number }>;
  toggleListingStatus(courseId: string): Promise<ICourse | null>;
}
