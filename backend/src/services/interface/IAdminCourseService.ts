import { ICourse } from "../../models/courseModel";
import { IChapter } from "../../models/chapterModel";
import { IQuiz } from "../../models/quizModel";
export interface IAdminCourseService {
  fetchAllCourses(search?: string, page?: number, limit?: number): Promise<{ data: ICourse[]; total: number }>;

  getCourseDetails(courseId: string): Promise<{
  course: ICourse | null;
  chapters: IChapter[];
  quiz: IQuiz | null;
}>;


  toggleCourseListing(courseId: string): Promise<ICourse | null>;

  toggleCourseVerification(courseId: string): Promise<ICourse | null>;

}
