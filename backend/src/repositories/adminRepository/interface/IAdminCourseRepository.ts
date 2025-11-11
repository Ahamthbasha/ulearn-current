import { ICourse } from "../../../models/courseModel";

import { IModule } from "../../../models/moduleModel";
export interface IAdminCourseRepository {
  getAllCourses(
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: ICourse[]; total: number }>;

 getCourseDetails(courseId: string): Promise<{
  course: ICourse | null;
  modules: IModule[];
}>

  toggleListingStatus(courseId: string): Promise<ICourse | null>;
  verifyCourse(
    courseId: string,
    status: "approved" | "rejected",
    review?: string,
  ): Promise<ICourse | null>;
}
