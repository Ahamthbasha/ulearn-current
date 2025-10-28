import { ICourse } from "../../../models/courseModel";
import { IChapter } from "../../../models/chapterModel";
import { IQuiz } from "../../../models/quizModel";
export interface IAdminCourseRepository {
  getAllCourses(
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: ICourse[]; total: number }>;

  getCourseDetails(courseId: string): Promise<{
    course: ICourse | null;
    chapters: IChapter[];
    quiz: IQuiz | null;
  }>;

  toggleListingStatus(courseId: string): Promise<ICourse | null>;
  verifyCourse(
    courseId: string,
    status: "approved" | "rejected",
    review?: string,
  ): Promise<ICourse | null>;
}
