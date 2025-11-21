import { ICourse } from "../../models/courseModel";
import { InstructorCourseDTO } from "../../dto/instructorDTO/instructorCourseDTO";
import { CourseResponseDto } from "../../dto/instructorDTO/courseDetailsDTO";
import { IInstructorCourseService } from "./interface/IInstructorCourseService";
import { IInstructorCourseRepository } from "../../repositories/instructorRepository/interface/IInstructorCourseRepository";
import { IInstructorChapterRepository } from "../../repositories/instructorRepository/interface/IInstructorChapterRepository";
import { IInstructorQuizRepository } from "../../repositories/instructorRepository/interface/IInstructorQuizRepository";
import { mapCourseToInstructorDTO } from "../../mappers/instructorMapper/instructorCourseMapper";
import { mapToCourseResponseDto } from "../../mappers/instructorMapper/courseDetailMapper";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { IInstructorModuleRepository } from "../../repositories/instructorRepository/interface/IInstructorModuleRepository";
import { ModuleValidationError, ValidationResult } from "../../interface/instructorInterface/IInstructorInterface";


export class InstructorCourseService implements IInstructorCourseService {
  private _courseRepository: IInstructorCourseRepository;
  private _chapterRepository: IInstructorChapterRepository;
  private _quizRepository: IInstructorQuizRepository;
  private _moduleRepository: IInstructorModuleRepository;

  constructor(
    courseRepository: IInstructorCourseRepository,
    chapterRepository: IInstructorChapterRepository,
    quizRepository: IInstructorQuizRepository,
    moduleRepository:IInstructorModuleRepository
  ) {
    this._courseRepository = courseRepository;
    this._chapterRepository = chapterRepository;
    this._quizRepository = quizRepository;
    this._moduleRepository = moduleRepository;
  }

  async createCourse(courseData: ICourse): Promise<ICourse> {
    return await this._courseRepository.createCourse(courseData);
  }

  async updateCourseDuration(courseId: string): Promise<void> {
    await this._courseRepository.updateCourseDuration(courseId);
  }

  async updateCourse(
    courseId: string,
    courseData: Partial<ICourse>,
  ): Promise<CourseResponseDto | null> {
    const updatedCourse = await this._courseRepository.updateCourse(
      courseId,
      courseData,
    );

    if (!updatedCourse) return null;

    const thumbnailSignedUrl = updatedCourse.thumbnailUrl
      ? await getPresignedUrl(updatedCourse.thumbnailUrl)
      : null;

    const demoVideoSignedUrl = updatedCourse.demoVideo?.url
      ? await getPresignedUrl(updatedCourse.demoVideo.url)
      : null;

    const responseData = {
      ...updatedCourse.toObject(),
      thumbnailSignedUrl,
      demoVideo: {
        ...updatedCourse.demoVideo,
        urlSigned: demoVideoSignedUrl,
      },
    };

    return mapToCourseResponseDto(responseData);
  }

  async deleteCourse(courseId: string): Promise<ICourse | null> {
    return await this._courseRepository.deleteCourse(courseId);
  }

  async getCourseById(courseId: string): Promise<CourseResponseDto | null> {
    const course = await this._courseRepository.getCourseById(courseId);

    if (!course) return null;

    const courseObj = course.toObject();

    const thumbnailSignedUrl = courseObj.thumbnailUrl
      ? await getPresignedUrl(courseObj.thumbnailUrl)
      : null;

    const demoVideoSignedUrl = courseObj.demoVideo?.url
      ? await getPresignedUrl(courseObj.demoVideo.url)
      : null;
    const responseData = {
      ...courseObj,
      thumbnailSignedUrl,
      demoVideo: {
        ...courseObj.demoVideo,
        urlSigned: demoVideoSignedUrl,
      },
    };

    return mapToCourseResponseDto(responseData);
  }

  async getInstructorCoursesPaginated(
    instructorId: string,
    page: number,
    limit: number,
    search: string = "",
    status: string = "",
  ): Promise<{ data: InstructorCourseDTO[]; total: number }> {
    const result =
      await this._courseRepository.getCoursesByInstructorWithPagination(
        instructorId,
        page,
        limit,
        search,
        status,
      );

    const coursesWithSignedUrl = await Promise.all(
      result.data.map(async (course) => {
        const signedUrl = await getPresignedUrl(course.thumbnailUrl);
        return mapCourseToInstructorDTO({
          ...course.toObject(),
          thumbnailUrl: signedUrl,
        });
      }),
    );

    return {
      data: coursesWithSignedUrl,
      total: result.total,
    };
  }

  async isCourseAlreadyCreatedByInstructor(
    courseName: string,
    instructorId: string,
  ): Promise<boolean> {
    const existing = await this._courseRepository.findCourseByNameForInstructor(
      courseName,
      instructorId,
    );
    return !!existing;
  }

  async isCourseAlreadyCreatedByInstructorExcluding(
    courseName: string,
    instructorId: string,
    courseId: string,
  ): Promise<boolean> {
    const existing =
      await this._courseRepository.findCourseByNameForInstructorExcludingId(
        courseName,
        instructorId,
        courseId,
      );
    return !!existing;
  }

async canSubmitForVerification(courseId: string): Promise<ValidationResult> {
  const modules = await this._moduleRepository.getModulesByCourse(courseId);

  if (modules.length === 0) {
    return {
      isValid: false,
      errors: [
        {
          moduleId: "",
          moduleTitle: "No modules created",
          missingChapters: true,
          missingQuiz: true,
        },
      ],
    };
  }

  const errors: ModuleValidationError[] = [];

  for (const module of modules) {
    const [chapters, quiz] = await Promise.all([
      this._chapterRepository.getChaptersByModule(module._id.toString()),
      this._quizRepository?.getQuizByModuleId
        ? this._quizRepository.getQuizByModuleId(module._id.toString())
        : Promise.resolve(null),
    ]);

    const hasChapter = Array.isArray(chapters) && chapters.length > 0;
    const hasQuiz = this.isValidQuiz(quiz);

    if (!hasChapter || !hasQuiz) {
      errors.push({
        moduleId: module._id.toString(),
        moduleTitle: module.moduleTitle,
        missingChapters: !hasChapter,
        missingQuiz: !hasQuiz,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async submitCourseForVerification(courseId: string): Promise<ICourse | null> {
  const validation = await this.canSubmitForVerification(courseId);

  if (!validation.isValid) {
    const errorMessage = validation.errors
      ? validation.errors
          .map(
            (err) =>
              `Module "${err.moduleTitle}" is missing chapters: ${err.missingChapters}, missing quiz: ${err.missingQuiz}`
          )
          .join("; ")
      : "Course validation failed.";

    throw new Error(`Course cannot be submitted for verification: ${errorMessage}`);
  }

  return await this._courseRepository.submitCourseForVerification(courseId);
}


  async publishCourse(
    courseId: string,
    publishDate?: Date,
  ): Promise<ICourse | null> {
    return await this._courseRepository.publishCourse(courseId, publishDate);
  }

  async getVerifiedInstructorCourses(
    instructorId: string,
  ): Promise<{ courseId: string; courseName: string }[]> {
    return await this._courseRepository.getVerifiedCoursesByInstructor(
      instructorId,
    );
  }

async canPublishCourse(courseId: string): Promise<boolean> {
  // Check if course has at least one module
  const modules = await this._moduleRepository.getModulesByCourse(courseId);
  
  if (modules.length === 0) {
    return false;
  }

  // Check if ALL modules have chapters AND quizzes
  for (const module of modules) {
    const [chapters, quiz] = await Promise.all([
      this._chapterRepository.getChaptersByModule(module._id.toString()),
      this._quizRepository?.getQuizByModuleId
        ? this._quizRepository.getQuizByModuleId(module._id.toString())
        : Promise.resolve(null),
    ]);

    // Check if module has at least one chapter
    const hasChapter = Array.isArray(chapters) && chapters.length > 0;
    
    // Check if module has a valid quiz with questions
    const hasQuiz = this.isValidQuiz(quiz);

    // If ANY module is missing chapters or quiz, cannot publish
    if (!hasChapter || !hasQuiz) {
      return false;
    }
  }

  return true;
}

private isValidQuiz(quiz: unknown): boolean {
  if (quiz === null || quiz === undefined) {
    return false;
  }
  
  if (typeof quiz !== "object") {
    return false;
  }
  
  const quizObj = quiz as Record<string, unknown>;
  
  if (!("questions" in quizObj)) {
    return false;
  }
  
  return Array.isArray(quizObj.questions) && quizObj.questions.length > 0;
}
}