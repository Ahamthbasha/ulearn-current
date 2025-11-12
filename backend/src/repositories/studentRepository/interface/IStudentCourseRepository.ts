import { ICourseFullyPopulated } from "../../../models/courseModel";

export interface IStudentCourseRepository {
  getAllListedCourses(): Promise<
    { course: ICourseFullyPopulated }[]
  >

  getFilteredCourses(
    page: number,
    limit: number,
    searchTerm?: string,
    sort?: "name-asc" | "name-desc" | "price-asc" | "price-desc",
    categoryId?: string,
  ): Promise<{
    data: {
      course: ICourseFullyPopulated;
      chapterCount: number;
      quizQuestionCount: number;
    }[];
    total: number;
  }>;

  getCourseDetails(courseId: string): Promise<{
    course: ICourseFullyPopulated | null;
    chapterCount: number;
    quizQuestionCount: number;
  }>;

  getCourses(categoryId?: string): Promise<Array<{ _id: string; courseName: string }>>;
}