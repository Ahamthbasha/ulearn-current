// import { FilterQuery } from "mongoose";
// import { CourseModel, ICourse } from "../../models/courseModel";
// import { GenericRepository } from "../genericRepository";
// import { IInstructorCourseRepository } from "./interface/IInstructorCourseRepository";
// import { IInstructorModuleRepository } from "./interface/IInstructorModuleRepository";

// export class InstructorCourseRepository
//   extends GenericRepository<ICourse>
//   implements IInstructorCourseRepository
// {
//   private _moduleRepository : IInstructorModuleRepository
//   constructor(
//     moduleRepository : IInstructorModuleRepository
//   ) {
//     super(CourseModel);
//     this._moduleRepository = moduleRepository
//   }

//   async createCourse(courseData: ICourse): Promise<ICourse> {
//     return await this.create(courseData);
//   }

//   async updateCourseDuration(courseId: string): Promise<void> {
    
//     const modules = await this._moduleRepository.getModulesByCourse(courseId);

//     const totalDurationSeconds = modules.reduce((sum, module) => {
//       const dur = Number(module.duration) || 0;
//       return sum + dur;
//     }, 0);

//     const updatedDuration = totalDurationSeconds.toString();

//     await this.updateCourse(courseId, { duration: updatedDuration });
//   }

//   async updateCourse(
//     courseId: string,
//     courseData: Partial<ICourse>,
//   ): Promise<ICourse | null> {
//     return await this.update(courseId, courseData);
//   }

//   async deleteCourse(courseId: string): Promise<ICourse | null> {
//     return await this.delete(courseId);
//   }

//   async getCourseById(courseId: string): Promise<ICourse | null> {
//     return await this.findByIdWithPopulate(courseId, {
//       path: "category",
//       select: "categoryName",
//     });
//   }

//   async getCoursesByInstructorWithPagination(
//     instructorId: string,
//     page: number,
//     limit: number,
//     search: string = "",
//     status: string = "",
//   ): Promise<{ data: ICourse[]; total: number }> {
//     const filter: FilterQuery<ICourse> = { instructorId };

//     if (search) {
//       filter.courseName = { $regex: new RegExp(search, "i") };
//     }

//     if (status) {
//       if (status === "published") {
//         filter.isPublished = true;
//       } else if (status === "unpublished") {
//         filter.isPublished = false;
//       } else if (status === "scheduled") {
//         filter.publishDate = { $exists: true, $ne: null };
//         filter.isPublished = false;
//       }
//     }

//     return await this.paginate(
//       filter,
//       page,
//       limit,
//       { createdAt: -1 },
//       { path: "category", select: "categoryName" },
//     );
//   }

//   async findCourseByNameForInstructor(
//     courseName: string,
//     instructorId: string,
//   ): Promise<ICourse | null> {
//     return await this.findOne({ courseName, instructorId });
//   }

//   async findCourseByNameForInstructorExcludingId(
//     courseName: string,
//     instructorId: string,
//     excludeId: string,
//   ): Promise<ICourse | null> {
//     return await this.findOne({
//       courseName,
//       instructorId,
//       _id: { $ne: excludeId },
//     });
//   }

//   async publishCourse(
//     courseId: string,
//     publishDate?: Date,
//   ): Promise<ICourse | null> {
//     const updateData: Partial<ICourse> = publishDate
//       ? { publishDate }
//       : { isPublished: true, publishDate: undefined };
//     return await this.update(courseId, updateData);
//   }

//   async getScheduledCourses(): Promise<ICourse[]> {
//     return await this.find({
//       publishDate: { $lte: new Date(), $exists: true, $ne: null },
//       isPublished: false,
//     });
//   }

//   async validateCoursesForInstructor(
//     courseIds: string[],
//     instructorId: string,
//   ): Promise<boolean> {
//     const count = await this.countDocuments({
//       _id: { $in: courseIds },
//       instructorId,
//       isPublished: true,
//     });
//     return count === courseIds.length;
//   }

//   async submitCourseForVerification(courseId: string): Promise<ICourse | null> {
//     return await this.update(courseId, { isSubmitted: true, review: "" });
//   }

//   async getVerifiedCoursesByInstructor(
//     instructorId: string,
//   ): Promise<{ courseId: string; courseName: string }[]> {
//     const filter: FilterQuery<ICourse> = { instructorId, isVerified: true };

//     const courses = await this.findWithProjection(filter, {
//       _id: 1,
//       courseName: 1,
//     });

//     return courses.map((course) => ({
//       courseId: course._id.toString(),
//       courseName: course.courseName,
//     }));
//   }
// }

























import { FilterQuery } from "mongoose";
import { CourseModel, ICourse } from "../../models/courseModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorCourseRepository } from "./interface/IInstructorCourseRepository";
import { IInstructorModuleRepository } from "./interface/IInstructorModuleRepository";

export class InstructorCourseRepository
  extends GenericRepository<ICourse>
  implements IInstructorCourseRepository
{
  private _moduleRepository : IInstructorModuleRepository
  constructor(
    moduleRepository : IInstructorModuleRepository
  ) {
    super(CourseModel);
    this._moduleRepository = moduleRepository
  }

  async createCourse(courseData: ICourse): Promise<ICourse> {
    return await this.create(courseData);
  }

  async updateCourseDuration(courseId: string): Promise<void> {
    
    const modules = await this._moduleRepository.getModulesByCourse(courseId);

    const totalDurationSeconds = modules.reduce((sum, module) => {
      const dur = Number(module.duration) || 0;
      return sum + dur;
    }, 0);

    const updatedDuration = totalDurationSeconds.toString();

    await this.updateCourse(courseId, { duration: updatedDuration });
  }

  async updateCourse(
    courseId: string,
    courseData: Partial<ICourse>,
  ): Promise<ICourse | null> {
    return await this.update(courseId, courseData);
  }

  async deleteCourse(courseId: string): Promise<ICourse | null> {
    return await this.delete(courseId);
  }

  async getCourseById(courseId: string): Promise<ICourse | null> {
    return await this.findByIdWithPopulate(courseId, {
      path: "category",
      select: "categoryName",
    });
  }

  async getCoursesByInstructorWithPagination(
    instructorId: string,
    page: number,
    limit: number,
    search: string = "",
    status: string = "",
  ): Promise<{ data: ICourse[]; total: number }> {
    const filter: FilterQuery<ICourse> = { instructorId };

    if (search) {
      filter.courseName = { $regex: new RegExp(search, "i") };
    }

    if (status) {
      if (status === "published") {
        filter.isPublished = true;
      } else if (status === "unpublished") {
        filter.isPublished = false;
      } else if (status === "scheduled") {
        filter.publishDate = { $exists: true, $ne: null };
        filter.isPublished = false;
      }
    }

    return await this.paginate(
      filter,
      page,
      limit,
      { createdAt: -1 },
      { path: "category", select: "categoryName" },
    );
  }

  async findCourseByNameForInstructor(
    courseName: string,
    instructorId: string,
  ): Promise<ICourse | null> {
    return await this.findOne({ courseName, instructorId });
  }

  async findCourseByNameForInstructorExcludingId(
    courseName: string,
    instructorId: string,
    excludeId: string,
  ): Promise<ICourse | null> {
    return await this.findOne({
      courseName,
      instructorId,
      _id: { $ne: excludeId },
    });
  }

  async publishCourse(
    courseId: string,
    publishDate?: Date,
  ): Promise<ICourse | null> {
    const updateData: Partial<ICourse> = publishDate
      ? { publishDate }
      : { isPublished: true, publishDate: undefined };
    return await this.update(courseId, updateData);
  }

  async getScheduledCourses(): Promise<ICourse[]> {
    // Get current time in UTC (MongoDB stores dates in UTC)
    const nowUTC = new Date();
    
    console.log('Checking scheduled courses at (UTC):', nowUTC.toISOString());
    console.log('Checking scheduled courses at (IST):', nowUTC.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    const courses = await this.find({
      publishDate: { $lte: nowUTC, $exists: true, $ne: null },
      isPublished: false,
    });

    // Log found courses for debugging
    if (courses.length > 0) {
      console.log(`Found ${courses.length} courses to publish:`);
      courses.forEach(course => {
        console.log(
          `- ${course.courseName} (ID: ${course._id}), ` +
          `publishDate (UTC): ${course.publishDate?.toISOString()}, ` +
          `publishDate (IST): ${course.publishDate?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
        );
      });
    } else {
      console.log('No courses found to publish at this time');
    }

    return courses;
  }

  async validateCoursesForInstructor(
    courseIds: string[],
    instructorId: string,
  ): Promise<boolean> {
    const count = await this.countDocuments({
      _id: { $in: courseIds },
      instructorId,
      isPublished: true,
    });
    return count === courseIds.length;
  }

  async submitCourseForVerification(courseId: string): Promise<ICourse | null> {
    return await this.update(courseId, { isSubmitted: true, review: "" });
  }

  async getVerifiedCoursesByInstructor(
    instructorId: string,
  ): Promise<{ courseId: string; courseName: string }[]> {
    const filter: FilterQuery<ICourse> = { instructorId, isVerified: true };

    const courses = await this.findWithProjection(filter, {
      _id: 1,
      courseName: 1,
    });

    return courses.map((course) => ({
      courseId: course._id.toString(),
      courseName: course.courseName,
    }));
  }
}