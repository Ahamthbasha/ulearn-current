import { ICourse } from "../../models/courseModel";

export interface IAdminCourseService {
  fetchAllCourses(search?: string, page?: number, limit?: number): Promise<{ data: ICourse[]; total: number }>;
  toggleCourseListing(courseId: string): Promise<ICourse | null>;
}
