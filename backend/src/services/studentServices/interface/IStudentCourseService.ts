import { CourseDetailDTO } from "../../../dto/userDTO/courseDetailDTO";
import { ICourse } from "../../../models/courseModel";

export interface IStudentCourseService {
  getAllCoursesWithDetails(): Promise<CourseDetailDTO[]>;

  getFilteredCoursesWithDetails(
    page: number,
    limit: number,
    searchTerm?: string,
    sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc",
    categoryId?: string
  ): Promise<{
    data: CourseDetailDTO[];
    total: number;
  }>;

  getCourseDetailsById(courseId: string): Promise<CourseDetailDTO | null>;

  // For internal use when raw course data is needed
  getCourseRaw(courseId: string): Promise<{
    course: ICourse | null;
    chapterCount: number;
    quizQuestionCount: number;
  }>;
}

