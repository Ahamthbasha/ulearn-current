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

export class InstructorCourseService implements IInstructorCourseService {
  private _courseRepository: IInstructorCourseRepository;
  private _chapterRepository: IInstructorChapterRepository;
  private _quizRepository: IInstructorQuizRepository;

  constructor(
    courseRepository: IInstructorCourseRepository,
    chapterRepository: IInstructorChapterRepository,
    quizRepository: IInstructorQuizRepository,
  ) {
    this._courseRepository = courseRepository;
    this._chapterRepository = chapterRepository;
    this._quizRepository = quizRepository;
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

    // Generate presigned URLs
    const thumbnailSignedUrl = updatedCourse.thumbnailUrl
      ? await getPresignedUrl(updatedCourse.thumbnailUrl)
      : null;

    const demoVideoSignedUrl = updatedCourse.demoVideo?.url
      ? await getPresignedUrl(updatedCourse.demoVideo.url)
      : null;

    // Create response object with signed URLs
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

    // Generate signed URLs
    const thumbnailSignedUrl = courseObj.thumbnailUrl
      ? await getPresignedUrl(courseObj.thumbnailUrl)
      : null;

    const demoVideoSignedUrl = courseObj.demoVideo?.url
      ? await getPresignedUrl(courseObj.demoVideo.url)
      : null;

    // Create response data with signed URLs
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

    // Generate signed URLs and map to DTOs
    const coursesWithSignedUrl = await Promise.all(
      result.data.map(async (course) => {
        const signedUrl = await getPresignedUrl(course.thumbnailUrl);
        return mapCourseToInstructorDTO({
          ...course.toObject(),
          thumbnailUrl: signedUrl, // override with signed URL
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

  async canPublishCourse(courseId: string): Promise<boolean> {
    const chapters =
      await this._chapterRepository.getChaptersByCourse(courseId);
    const quiz = await this._quizRepository.getQuizByCourseId(courseId);
    return (
      chapters.length > 0 &&
      !!quiz &&
      Array.isArray(quiz.questions) &&
      quiz.questions.length > 0
    );
  }

  async publishCourse(courseId: string): Promise<ICourse | null> {
    return await this._courseRepository.updateCourse(courseId, {
      isPublished: true,
    });
  }
}
