import { IStudentCourseService } from "./interface/IStudentCourseService";
import { IStudentCourseRepository } from "../../repositories/studentRepository/interface/IStudentCourseRepository";
import { ICourse } from "../../models/courseModel";
import { CourseDetailDTO } from "../../dto/userDTO/courseDetailDTO";
import { mapCourseToDetailDTO } from "../../mappers/userMapper/mapCourseToDetailDTO";

export class StudentCourseService implements IStudentCourseService {
  private _studentCourseRepo: IStudentCourseRepository;

  constructor(studentCourseRepo: IStudentCourseRepository) {
    this._studentCourseRepo = studentCourseRepo;
  }

  async getAllCoursesWithDetails(): Promise<CourseDetailDTO[]> {
    const courses = await this._studentCourseRepo.getAllListedCourses();

    const courseDTOs: CourseDetailDTO[] = [];

    for (const courseData of courses) {
      const dto = mapCourseToDetailDTO(
        courseData.course,
        courseData.chapterCount,
        courseData.quizQuestionCount,
      );
      console.log(`getAllCoursesWithDetails ${dto.courseId}: price=${dto.price}, originalPrice=${dto.originalPrice}, discountedPrice=${dto.discountedPrice}`);
      courseDTOs.push(dto);
    }

    return courseDTOs;
  }

  async getFilteredCoursesWithDetails(
    page: number,
    limit: number,
    searchTerm = "",
    sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc",
    categoryId?: string,
  ): Promise<{
    data: CourseDetailDTO[];
    total: number;
  }> {
    const result = await this._studentCourseRepo.getFilteredCourses(
      page,
      limit,
      searchTerm,
      sort,
      categoryId,
    );

    const courseDTOs: CourseDetailDTO[] = [];

    for (const courseData of result.data) {
      const dto = mapCourseToDetailDTO(
        courseData.course,
        courseData.chapterCount,
        courseData.quizQuestionCount,
      );
      console.log(`getFilteredCoursesWithDetails ${dto.courseId}: price=${dto.price}, originalPrice=${dto.originalPrice}, discountedPrice=${dto.discountedPrice}`);
      courseDTOs.push(dto);
    }

    return {
      data: courseDTOs,
      total: result.total,
    };
  }

  async getCourseDetailsById(
    courseId: string,
  ): Promise<CourseDetailDTO | null> {
    const courseData = await this._studentCourseRepo.getCourseDetails(courseId);

    if (!courseData.course) {
      return null;
    }

    const dto = mapCourseToDetailDTO(
      courseData.course,
      courseData.chapterCount,
      courseData.quizQuestionCount,
    );
    console.log(`getCourseDetailsById ${dto.courseId}: price=${dto.price}, originalPrice=${dto.originalPrice}, discountedPrice=${dto.discountedPrice}`);

    return dto;
  }

  async getCourseRaw(courseId: string): Promise<{
    course: ICourse | null;
    chapterCount: number;
    quizQuestionCount: number;
  }> {
    return await this._studentCourseRepo.getCourseDetails(courseId);
  }
}