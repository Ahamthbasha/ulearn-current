import { CourseModel, ICourse } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorCourseRepository } from "../interfaces/IInstructorCourseRepository";

export class InstructorCourseRepository
  extends GenericRepository<ICourse>
  implements IInstructorCourseRepository
{
  constructor() {
    super(CourseModel);
  }

  async createCourse(courseData: ICourse): Promise<ICourse> {
    return await this.create(courseData);
  }

  async updateCourse(courseId: string, courseData: Partial<ICourse>): Promise<ICourse | null> {
    return await this.update(courseId, courseData); // ✅ using GenericRepository method
  }

  async deleteCourse(courseId: string): Promise<ICourse | null> {
    return await this.delete(courseId); // ✅ using GenericRepository method
  }

  async getCourseById(courseId: string): Promise<ICourse | null> {
    return await this.findByIdWithPopulate(courseId,{
      path:'category',
      select:'categoryName'
    }); // ✅ using GenericRepository method
  }

async getCoursesByInstructorWithPagination(
  instructorId: string,
  page: number,
  limit: number,
  search: string = ""
): Promise<{ data: ICourse[]; total: number }> {
  const filter: any = { instructorId };

  if (search) {
    filter.courseName = { $regex: new RegExp(search, "i") }; // case-insensitive search
  }

  return await this.paginate(
    filter,
    page,
    limit,
    { createdAt: -1 },
    {path:'category',select:'categoryName'}
  );
}


async findCourseByNameForInstructor(courseName: string, instructorId: string): Promise<ICourse | null> {
  return await this.findOne({ courseName, instructorId });
}

async findCourseByNameForInstructorExcludingId(courseName: string, instructorId: string, excludeId: string): Promise<ICourse | null> {
  return await this.findOne({
    courseName,
    instructorId,
    _id: { $ne: excludeId },
  });
}

async publishCourse(courseId: string): Promise<ICourse | null> {
  return await this.update(courseId, { isPublished: true });
}


}
