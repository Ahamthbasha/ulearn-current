import { ICourse } from "../../models/courseModel";

export interface IInstructorCourseService {
  createCourse(courseData: ICourse): Promise<ICourse>;
  updateCourse(courseId: string, courseData: Partial<ICourse>): Promise<ICourse | null>;
  deleteCourse(courseId: string): Promise<ICourse | null>;
  getCourseById(courseId: string): Promise<ICourse | null>;

 getInstructorCoursesPaginated(
  instructorId: string,
  page: number,
  limit: number,
  search?: string
): Promise<{ data: ICourse[]; total: number }>;


  isCourseAlreadyCreatedByInstructor(courseName: string, instructorId: string): Promise<boolean>;
  isCourseAlreadyCreatedByInstructorExcluding(courseName: string, instructorId: string, courseId: string): Promise<boolean>;


publishCourse(courseId: string): Promise<ICourse | null>;
canPublishCourse(courseId: string): Promise<boolean>;

}
