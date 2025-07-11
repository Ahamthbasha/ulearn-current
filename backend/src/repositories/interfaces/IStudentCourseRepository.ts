import { ICourse } from "src/models/courseModel";

export interface IStudentCourseRepository {
  getAllListedCourses(): Promise<
    {
      course: ICourse;
      chapterCount: number;
      quizQuestionCount: number;
    }[]
  >;

getFilteredCourses(
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



  getCourseDetails(
    courseId: string
  ): Promise<{
    course: ICourse | null;
    chapterCount: number;
    quizQuestionCount: number;
  }>;
}
