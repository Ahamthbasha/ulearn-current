import { IStudentCourseService } from "./interface/IStudentCourseService";
import { IStudentCourseRepository } from "../../repositories/studentRepository/interface/IStudentCourseRepository";
import { IStudentModuleRepository } from "../../repositories/studentRepository/interface/IStudentModuleRepository";
import { CourseDetailDTO } from "../../dto/userDTO/courseDetailDTO";
import { mapCourseToDetailDTO } from "../../mappers/userMapper/mapCourseToDetailDTO";
import { ICourseFullyPopulated } from "../../models/courseModel";

export class StudentCourseService implements IStudentCourseService {
  private _studentCourseRepo: IStudentCourseRepository;
  private _studentModuleRepo: IStudentModuleRepository;

  constructor(
    studentCourseRepo: IStudentCourseRepository,
    studentModuleRepo: IStudentModuleRepository,
  ) {
    this._studentCourseRepo = studentCourseRepo;
    this._studentModuleRepo = studentModuleRepo;
  }


  async getAllCoursesWithDetails(): Promise<CourseDetailDTO[]> {
    const raw = await this._studentCourseRepo.getAllListedCourses();

    const dtos: CourseDetailDTO[] = [];
    for (const { course} of raw) {
      const populatedCourse = course as ICourseFullyPopulated
      const modules = await this._studentModuleRepo.getModulesByCourseId(course._id.toString());
      const dto = mapCourseToDetailDTO(populatedCourse, modules);

      dtos.push(dto);
    }
    return dtos;
  }

  async getFilteredCoursesWithDetails(
    page: number,
    limit: number,
    searchTerm = "",
    sort: "name-asc" | "name-desc" | "price-asc" | "price-desc" = "name-asc",
    categoryId?: string,
  ): Promise<{ data: CourseDetailDTO[]; total: number }> {
    const result = await this._studentCourseRepo.getFilteredCourses(
      page,
      limit,
      searchTerm,
      sort,
      categoryId,
    );

    const dtos: CourseDetailDTO[] = [];
    for (const { course } of result.data) {
      const modules = await this._studentModuleRepo.getModulesByCourseId(course._id.toString());
      const dto = mapCourseToDetailDTO(course, modules);
      dtos.push(dto);
    }

    return { data: dtos, total: result.total };
  }

  async getCourseDetailsById(courseId: string): Promise<CourseDetailDTO | null> {
    const raw = await this._studentCourseRepo.getCourseDetails(courseId);
    if (!raw.course) return null;

    const modules = await this._studentModuleRepo.getModulesByCourseId(courseId);
    const dto = mapCourseToDetailDTO(raw.course, modules);
    return dto;
  }

  async getCourseRaw(courseId: string) {
    return this._studentCourseRepo.getCourseDetails(courseId);
  }

  async getCourses(categoryId?: string) {
    return this._studentCourseRepo.getCourses(categoryId);
  }
}