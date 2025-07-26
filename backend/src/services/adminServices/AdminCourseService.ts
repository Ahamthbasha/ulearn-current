import { IAdminCourseService } from "../interface/IAdminCourseService";
import { IAdminCourseRepository } from "../../repositories/interfaces/IAdminCourseRepository";
import { ICourse } from "../../models/courseModel";
import { IChapter } from "../../models/chapterModel";
import { IQuiz } from "../../models/quizModel";

export class AdminCourseService implements IAdminCourseService {
  constructor(private readonly courseRepository: IAdminCourseRepository) {}

  async fetchAllCourses(search = "", page = 1, limit = 10): Promise<{ data: ICourse[]; total: number }> {
    return await this.courseRepository.getAllCourses(search, page, limit);
  }

  async getCourseDetails(courseId: string): Promise<{
  course: ICourse | null;
  chapters: IChapter[];
  quiz: IQuiz | null;
}> {
  return await this.courseRepository.getCourseDetails(courseId);
}


  async toggleCourseListing(courseId: string): Promise<ICourse | null> {
    return await this.courseRepository.toggleListingStatus(courseId);
  }

  async toggleCourseVerification(courseId: string): Promise<ICourse | null> {
  return await this.courseRepository.toggleVerificationStatus(courseId);
}

}
