import { ICourse } from "../../models/courseModel";
import { IInstructorCourseService } from "../interface/IInstructorCourseService";
import { IInstructorCourseRepository } from "../../repositories/interfaces/IInstructorCourseRepository";
import { IInstructorChapterRepository } from "../../repositories/interfaces/IInstructorChapterRepository";
import { IInstructorQuizRepository } from "../../repositories/interfaces/IInstructorQuizRepository";
export class InstructorCourseService implements IInstructorCourseService {
  private courseRepository: IInstructorCourseRepository
  private chapterRepository: IInstructorChapterRepository
  private quizRepository: IInstructorQuizRepository
  constructor( courseRepository: IInstructorCourseRepository,chapterRepository: IInstructorChapterRepository,quizRepository: IInstructorQuizRepository) {
    this.courseRepository = courseRepository
    this.chapterRepository = chapterRepository
    this.quizRepository = quizRepository
  }

  async createCourse(courseData: ICourse): Promise<ICourse> {
    return await this.courseRepository.createCourse(courseData);
  }

  async updateCourse(courseId: string, courseData: Partial<ICourse>): Promise<ICourse | null> {
    return await this.courseRepository.updateCourse(courseId, courseData);
  }

  async deleteCourse(courseId: string): Promise<ICourse | null> {
    return await this.courseRepository.deleteCourse(courseId);
  }

  async getCourseById(courseId: string): Promise<ICourse | null> {
    return await this.courseRepository.getCourseById(courseId);
  }

 async getInstructorCoursesPaginated(
  instructorId: string,
  page: number,
  limit: number,
  search: string = ""
): Promise<{ data: ICourse[]; total: number }> {
  return await this.courseRepository.getCoursesByInstructorWithPagination(instructorId, page, limit, search);
}


async isCourseAlreadyCreatedByInstructor(courseName: string, instructorId: string): Promise<boolean> {
  const existing = await this.courseRepository.findCourseByNameForInstructor(courseName, instructorId);
  return !!existing;
}

async isCourseAlreadyCreatedByInstructorExcluding(courseName: string, instructorId: string, courseId: string): Promise<boolean> {
  const existing = await this.courseRepository.findCourseByNameForInstructorExcludingId(courseName, instructorId, courseId);
  return !!existing;
}

async canPublishCourse(courseId: string): Promise<boolean> {
    const chapters = await this.chapterRepository.getChaptersByCourse(courseId);
    const quiz = await this.quizRepository.getQuizByCourseId(courseId);
    return chapters.length > 0 && !!quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0;

  }

  async publishCourse(courseId: string): Promise<ICourse | null> {
    return await this.courseRepository.updateCourse(courseId, { isPublished: true });
  }


}
