import { IAdminCourseRepository } from "../interfaces/IAdminCourseRepository";
import { ICourse, CourseModel } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";

export class AdminCourseRepository
  extends GenericRepository<ICourse>
  implements IAdminCourseRepository
{
  constructor() {
    super(CourseModel);
  }

  async getAllCourses(search = "", page = 1, limit = 10): Promise<{ data: ICourse[]; total: number }> {
    const filter = search
      ? { courseName: { $regex: search, $options: "i" } }
      : {};

    return await this.paginate(filter, page, limit, { createdAt: -1 });
  }

  async toggleListingStatus(courseId: string): Promise<ICourse | null> {
    const course = await this.findById(courseId);
    if (!course) return null;

    return await this.update(courseId, { isListed: !course.isListed });
  }
}
