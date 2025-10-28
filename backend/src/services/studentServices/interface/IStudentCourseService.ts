import { CourseDetailDTO } from "../../../dto/userDTO/courseDetailDTO";
import { ICourse } from "../../../models/courseModel";

export interface IStudentCourseService {
  getAllCoursesWithDetails(): Promise<CourseDetailDTO[]>;

  getFilteredCoursesWithDetails(
    page: number,
    limit: number,
    searchTerm?: string,
    sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc",
    categoryId?: string,
  ): Promise<{
    data: CourseDetailDTO[];
    total: number;
  }>;

  getCourseDetailsById(courseId: string): Promise<CourseDetailDTO | null>;

  getCourseRaw(courseId: string): Promise<{
    course: ICourse | null;
    chapterCount: number;
    quizQuestionCount: number;
  }>;

  getCourses(categoryId?:string): Promise<Array<{ _id: string; courseName: string }>>;
}