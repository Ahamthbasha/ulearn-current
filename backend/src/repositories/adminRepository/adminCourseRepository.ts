import { IAdminCourseRepository } from "./interface/IAdminCourseRepository";
import { ICourse, CourseModel } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { FilterQuery } from "mongoose";
import { IModule } from "../../models/moduleModel";
import { ModuleDetailRepository } from "../ModuleRepository";
export class AdminCourseRepository
  extends GenericRepository<ICourse>
  implements IAdminCourseRepository
{
  private _moduleRepo : ModuleDetailRepository
  constructor(moduleRepo:ModuleDetailRepository) {
    super(CourseModel);
    this._moduleRepo = moduleRepo
  }

  async getAllCourses(
    search = "",
    page = 1,
    limit = 10,
  ): Promise<{ data: ICourse[]; total: number }> {
    const filter: FilterQuery<ICourse> = { isSubmitted: true }; // Only show submitted courses

    if (search) {
      filter.courseName = { $regex: search, $options: "i" };
    }

    return await this.paginate(filter, page, limit, { createdAt: -1 });
  }

  async getCourseDetails(courseId: string): Promise<{
  course: ICourse | null;
  modules: IModule[];
}> {
  const course = await this.findById(courseId);
  if (!course) return { course: null, modules: [] };

  // Fetch modules for the course
  const modules = await this._moduleRepo.find({ courseId });
  
  return { course, modules };
}

  async toggleListingStatus(courseId: string): Promise<ICourse | null> {
    const course = await this.findById(courseId);
    if (!course) return null;

    return await this.update(courseId, { isListed: !course.isListed });
  }

  async verifyCourse(
    courseId: string,
    status: "approved" | "rejected",
    review?: string,
  ): Promise<ICourse | null> {
    const course = await this.findById(courseId);
    if (!course) return null;

    const updateData: Partial<ICourse> = {
      isVerified: status === "approved",
      isListed: status === "approved",
      review: status === "rejected" ? review || "" : "",
      isSubmitted: status === "rejected" ? false : course.isSubmitted, // Reset isSubmitted on rejection
    };

    return await this.update(courseId, updateData);
  }
}
