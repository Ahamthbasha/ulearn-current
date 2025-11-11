import { ICoursePopulated } from "../../../models/courseModel";

export interface IStudentCourseRepository {
  getAllListedCourses(): Promise<
    { course: ICoursePopulated }[]
  >

  getFilteredCourses(
    page: number,
    limit: number,
    searchTerm?: string,
    sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc",
    categoryId?: string,
  ): Promise<{
    data: {
      course: ICoursePopulated;
      chapterCount: number;
      quizQuestionCount: number;
    }[];
    total: number;
  }>;

  getCourseDetails(courseId: string): Promise<{
    course: ICoursePopulated | null;
    chapterCount: number;
    quizQuestionCount: number;
  }>;

  getCourses(categoryId?: string): Promise<Array<{ _id: string; courseName: string }>>;
}