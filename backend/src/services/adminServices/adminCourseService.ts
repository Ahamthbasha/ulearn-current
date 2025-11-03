import { IAdminCourseService } from "./interface/IAdminCourseService";
import { IAdminCourseRepository } from "../../repositories/adminRepository/interface/IAdminCourseRepository";

import { ICourseDTO } from "../../dto/adminDTO/courseListDTO";
import { CourseDetailsResponseDTO } from "../../dto/adminDTO/courseDetailDTO";
import { mapCoursesToDTO } from "../../mappers/adminMapper/courseListMapper";
import {
  mapCourseDetailsResponseToDTO,
  mapCourseDetailsToDTO,
} from "../../mappers/adminMapper/courseDetailMapper";

export class AdminCourseService implements IAdminCourseService {
  private _courseRepository: IAdminCourseRepository;

  constructor(courseRepository: IAdminCourseRepository) {
    this._courseRepository = courseRepository;
  }

  async fetchAllCourses(
    search = "",
    page = 1,
    limit = 10,
  ): Promise<{ data: ICourseDTO[]; total: number }> {
    const { data, total } = await this._courseRepository.getAllCourses(
      search,
      page,
      limit,
    );
    const mapped = mapCoursesToDTO(data);
    return { data: mapped, total };
  }

  async getCourseDetails(
    courseId: string,
  ): Promise<CourseDetailsResponseDTO | null> {
    const { course, chapters, quiz } =
      await this._courseRepository.getCourseDetails(courseId);

    if (!course) return null;

    return mapCourseDetailsResponseToDTO(course, chapters, quiz);
  }

  async toggleCourseListing(courseId: string): Promise<ICourseDTO | null> {
    const updatedCourse =
      await this._courseRepository.toggleListingStatus(courseId);
    return updatedCourse ? mapCourseDetailsToDTO(updatedCourse) : null;
  }

  async verifyCourse(
    courseId: string,
    status: "approved" | "rejected",
    review?: string,
  ): Promise<ICourseDTO | null> {
    const updatedCourse = await this._courseRepository.verifyCourse(
      courseId,
      status,
      review,
    );
    return updatedCourse ? mapCourseDetailsToDTO(updatedCourse) : null;
  }
}
