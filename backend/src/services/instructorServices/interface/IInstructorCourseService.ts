import { ICourse } from "../../../models/courseModel";
import { InstructorCourseDTO } from "../../../dto/instructorDTO/instructorCourseDTO";
import { CourseResponseDto } from "../../../dto/instructorDTO/courseDetailsDTO";
import { ValidationResult } from "../../../interface/instructorInterface/IInstructorInterface";

export interface IInstructorCourseService {
  createCourse(courseData: ICourse): Promise<ICourse>;
  updateCourseDuration(courseId: string): Promise<void>
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
  getVerifiedInstructorCourses(
    instructorId: string,
  ): Promise<{ courseId: string; courseName: string }[]>;
  canSubmitForVerification(courseId: string): Promise<ValidationResult>;
  submitCourseForVerification(courseId: string): Promise<ICourse | null>;
}