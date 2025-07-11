import { ICourse } from "../../models/courseModel";

export interface IStudentCourseService {
  getAllCoursesWithDetails(): Promise<{
    course: ICourse;
    chapterCount: number;
    quizQuestionCount: number;
  }[]>;

getFilteredCoursesWithDetails(
  page: number,
  limit: number,
  searchTerm?: string,
  sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc",
  categoryId?: string
): Promise<{
  data: {
    course: ICourse;
    chapterCount: number;
    quizQuestionCount: number;
  }[];
  total: number;
}>;



  getCourseDetailsById(
    courseId: string
  ): Promise<{
    course: ICourse | null;
    chapterCount: number;
    quizQuestionCount: number;
  }>;
}
