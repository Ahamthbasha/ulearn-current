import { IAdminCourseService } from "./interface/IAdminCourseService";
import { IAdminCourseRepository } from "../../repositories/adminRepository/interface/IAdminCourseRepository";
import { ICourseDTO } from "../../dto/adminDTO/courseListDTO";
import {
  mapCoursesToDTO
} from "../../mappers/adminMapper/courseListMapper";
import {
  mapCourseDetailsToDTO,
  mapModuleToDTO,
} from "../../mappers/adminMapper/courseDetailMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { ChapterDetailRepository } from "../../repositories/ChapterRepository";
import { QuizDetailRepository } from "../../repositories/QuizRepository";
import { CourseDetailsDTO, ModuleDetailsDTO } from "../../dto/adminDTO/courseDetailDTO";
import { IAdminCategoryRepository } from "src/repositories/adminRepository/interface/IAdminCategoryRepository";
import { IAdminInstructorRepository } from "src/repositories/adminRepository/interface/IAdminInstructorRepository";

export class AdminCourseService implements IAdminCourseService {
  private _courseRepository: IAdminCourseRepository;
  private _chapterDetailRepo: ChapterDetailRepository;
  private _quizDetailRepo: QuizDetailRepository;
  private _instructorRepo : IAdminInstructorRepository;
  private _categoryRepo : IAdminCategoryRepository

  constructor(
    courseRepository: IAdminCourseRepository,
    chapterDetailRepo: ChapterDetailRepository,
    quizDetailRepo: QuizDetailRepository,
    instructorRepo:IAdminInstructorRepository,
    categoryRepo:IAdminCategoryRepository
  ) {
    this._courseRepository = courseRepository;
    this._chapterDetailRepo = chapterDetailRepo;
    this._quizDetailRepo = quizDetailRepo;
    this._instructorRepo = instructorRepo;
    this._categoryRepo = categoryRepo
  }

  async fetchAllCourses(
    search = "",
    page = 1,
    limit = 10
  ): Promise<{ data: ICourseDTO[]; total: number }> {
    const { data, total } = await this._courseRepository.getAllCourses(
      search,
      page,
      limit
    );
    const mapped = mapCoursesToDTO(data);
    return { data: mapped, total };
  }

  async getCourseDetails(courseId: string): Promise<CourseDetailsDTO | null> {
    const { course, modules } = await this._courseRepository.getCourseDetails(courseId);
    if (!course) return null;

    // Presign URLs
    if (course.demoVideo?.url) {
      course.demoVideo.url = await getPresignedUrl(course.demoVideo.url);
    }
    if (course.thumbnailUrl) {
      course.thumbnailUrl = await getPresignedUrl(course.thumbnailUrl);
    }

    // Fetch instructor name
    const instructor = await this._instructorRepo.findById(course.instructorId.toString());
    const instructorName = instructor?.username || ""; // adjust as per your instructor model

    // Fetch category name
    const category = await this._categoryRepo.findById(course.category.toString());
    const categoryName = category?.categoryName || ""; // adjust as per your category model

    // Fetch detailed modules as before
    const detailedModules: ModuleDetailsDTO[] = [];
    for (const module of modules) {
      const chapters = await this._chapterDetailRepo.find({ moduleId: module._id });
      for (const chapter of chapters) {
        if (chapter.videoUrl) {
          chapter.videoUrl = await getPresignedUrl(chapter.videoUrl);
        }
      }
      const quiz = await this._quizDetailRepo.findOne({ moduleId: module._id });
      const mappedModule = await mapModuleToDTO(module, chapters, quiz);
      detailedModules.push(mappedModule);
    }

    // Return DTO including instructorName and categoryName
    return {
      ...mapCourseDetailsToDTO(course, detailedModules),
      instructorName,
      categoryName,
    };
  }


  async toggleCourseListing(courseId: string): Promise<ICourseDTO | null> {
    const updatedCourse = await this._courseRepository.toggleListingStatus(
      courseId
    );
    return updatedCourse ? mapCourseDetailsToDTO(updatedCourse, []) : null;
  }

  async verifyCourse(
    courseId: string,
    status: "approved" | "rejected",
    review?: string
  ): Promise<ICourseDTO | null> {
    const updatedCourse = await this._courseRepository.verifyCourse(
      courseId,
      status,
      review
    );
    return updatedCourse ? mapCourseDetailsToDTO(updatedCourse, []) : null;
  }
}
