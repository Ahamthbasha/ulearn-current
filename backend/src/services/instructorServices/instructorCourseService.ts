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

  // async canPublishCourse(courseId: string): Promise<boolean> {
  //   const modules =
  //     await this._moduleRepository.getModulesByCourse(courseId);
  //   const quiz = await this._quizRepository.getQuizByCourseId(courseId);
  //   return (
  //     chapters.length > 0 &&
  //     !!quiz &&
  //     Array.isArray(quiz.questions) &&
  //     quiz.questions.length > 0
  //   );
  // }

    // async canSubmitForVerification(courseId: string): Promise<boolean> {
  //   const chapters = await this._chapterRepository.getChaptersByCourse(courseId);
  //   const quiz = await this._quizRepository.getQuizByCourseId(courseId);
    
  //   return (
  //     chapters.length > 0 &&
  //     !!quiz &&
  //     Array.isArray(quiz.questions) &&
  //     quiz.questions.length > 0
  //   );
  // }

  // async submitCourseForVerification(courseId: string): Promise<ICourse | null> {
  //   const canSubmit = await this.canSubmitForVerification(courseId);
    
  //   if (!canSubmit) {
  //     throw new Error("Course must have at least one chapter and one quiz with questions to submit for verification");
  //   }
    
  //   return await this._courseRepository.submitCourseForVerification(courseId);
  // }



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

  // Check if at least one module has chapters
  let hasChapters = false;
  for (const module of modules) {
    const chapters = await this._chapterRepository.getChaptersByModule(
      module._id.toString()
    );
    if (chapters.length > 0) {
      hasChapters = true;
      break;
    }
  }

  // Check if course has quiz with questions
  const quiz = await this._quizRepository.getQuizByCourseId(courseId);
  const hasValidQuiz =
    !!quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0;

  return hasChapters && hasValidQuiz;
}

async canSubmitForVerification(courseId: string): Promise<boolean> {
  // Check if course has at least one module
  const modules = await this._moduleRepository.getModulesByCourse(courseId);
  
  if (modules.length === 0) {
    return false;
  }

  // Check if at least one module has chapters
  let hasChapters = false;
  for (const module of modules) {
    const chapters = await this._chapterRepository.getChaptersByModule(
      module._id.toString()
    );
    if (chapters.length > 0) {
      hasChapters = true;
      break;
    }
  }

  // Check if course has quiz with questions
  const quiz = await this._quizRepository.getQuizByCourseId(courseId);
  const hasValidQuiz =
    !!quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0;

  return hasChapters && hasValidQuiz;
}

async submitCourseForVerification(courseId: string): Promise<ICourse | null> {
  const canSubmit = await this.canSubmitForVerification(courseId);
  
  if (!canSubmit) {
    throw new Error(
      "Course must have at least one module with chapters and one quiz with questions to submit for verification"
    );
  }
  
  return await this._courseRepository.submitCourseForVerification(courseId);
}
}
