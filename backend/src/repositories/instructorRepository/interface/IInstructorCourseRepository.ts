import { ICourse } from "../../../models/courseModel";

export interface IInstructorCourseRepository {
  createCourse(courseData: ICourse): Promise<ICourse>;
  updateCourseDuration(courseId: string): Promise<void> 
  updateCourse(
    courseId: string,
    courseData: Partial<ICourse>,
  ): Promise<ICourse | null>;
  deleteCourse(courseId: string): Promise<ICourse | null>;
  getCourseById(courseId: string): Promise<ICourse | null>;
  getCoursesByInstructorWithPagination(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: ICourse[]; total: number }>;
  findCourseByNameForInstructor(
    courseName: string,
    instructorId: string,
  ): Promise<ICourse | null>;
  findCourseByNameForInstructorExcludingId(
    courseName: string,
    instructorId: string,
    excludeId: string,
  ): Promise<ICourse | null>;
  publishCourse(courseId: string, publishDate?: Date): Promise<ICourse | null>;
  getScheduledCourses(): Promise<ICourse[]>;
  validateCoursesForInstructor(
    courseIds: string[],
    instructorId: string,
  ): Promise<boolean>;
  getVerifiedCoursesByInstructor(
    instructorId: string,
  ): Promise<{ courseId: string; courseName: string }[]>;
  submitCourseForVerification(courseId: string): Promise<ICourse | null>;
}
