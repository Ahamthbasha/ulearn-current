import { ICourseDTO } from "../../../dto/adminDTO/courseListDTO";
import { CourseDetailsResponseDTO } from "../../../dto/adminDTO/courseDetailDTO";

export interface IAdminCourseService {
  fetchAllCourses(search?: string, page?: number, limit?: number): Promise<{ data: ICourseDTO[]; total: number }>;

  getCourseDetails(courseId: string): Promise<CourseDetailsResponseDTO | null>;


  toggleCourseListing(courseId: string): Promise<ICourseDTO | null>;

  toggleCourseVerification(courseId: string): Promise<ICourseDTO | null>;
}
