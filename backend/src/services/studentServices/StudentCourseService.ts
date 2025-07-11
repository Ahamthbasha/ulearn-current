import { IStudentCourseService } from "../interface/IStudentCourseService";
import { IStudentCourseRepository } from "../../repositories/interfaces/IStudentCourseRepository";
import { ICourse } from "../../models/courseModel";

export class StudentCourseService implements IStudentCourseService {
  private studentCourseRepo: IStudentCourseRepository;

  constructor(studentCourseRepo: IStudentCourseRepository) {
    this.studentCourseRepo = studentCourseRepo;
  }

  async getAllCoursesWithDetails(): Promise<{
    course: ICourse;
    chapterCount: number;
    quizQuestionCount: number;
  }[]> {
    return await this.studentCourseRepo.getAllListedCourses();
  }

async getFilteredCoursesWithDetails(
  page: number,
  limit: number,
  searchTerm = "",
  sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc",
  categoryId?: string
): Promise<{
  data: {
    course: ICourse;
    chapterCount: number;
    quizQuestionCount: number;
  }[];
  total: number;
}> {
  return await this.studentCourseRepo.getFilteredCourses(page, limit, searchTerm, sort, categoryId);
}



  async getCourseDetailsById(courseId: string): Promise<{
    course: ICourse | null;
    chapterCount: number;
    quizQuestionCount: number;
  }> {
    return await this.studentCourseRepo.getCourseDetails(courseId);
  }
}
