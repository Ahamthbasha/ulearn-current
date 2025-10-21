import { ICourse } from "../../../models/courseModel";
import { InstructorCourseDTO } from "../../../dto/instructorDTO/instructorCourseDTO";
import { CourseResponseDto } from "../../../dto/instructorDTO/courseDetailsDTO";

export interface IInstructorCourseService {
  createCourse(courseData: ICourse): Promise<ICourse>;
  updateCourse(
    courseId: string,
    courseData: Partial<ICourse>,
  ): Promise<CourseResponseDto | null>;
  deleteCourse(courseId: string): Promise<ICourse | null>;
  getCourseById(courseId: string): Promise<CourseResponseDto | null>;
  getInstructorCoursesPaginated(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: InstructorCourseDTO[]; total: number }>;
  isCourseAlreadyCreatedByInstructor(
    courseName: string,
    instructorId: string,
  ): Promise<boolean>;
  isCourseAlreadyCreatedByInstructorExcluding(
    courseName: string,
    instructorId: string,
    courseId: string,
  ): Promise<boolean>;
  publishCourse(courseId: string, publishDate?: Date): Promise<ICourse | null>;
  canPublishCourse(courseId: string): Promise<boolean>;
  submitCourseForVerification(courseId: string): Promise<ICourse | null>;
  getVerifiedInstructorCourses(
    instructorId: string,
  ): Promise<{ courseId: string; courseName: string }[]>;
}