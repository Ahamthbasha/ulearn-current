import { IEnrollment, EnrollmentModel } from "../models/enrollmentModel";
import { GenericRepository } from "./genericRepository";
import mongoose, { PopulateOptions, Types } from "mongoose";
import { IEnrollmentRepository } from "./interfaces/IEnrollmentRepository";
export class EnrollmentRepository
  extends GenericRepository<IEnrollment>
  implements IEnrollmentRepository
{
  constructor() {
    super(EnrollmentModel);
  }

  async findByUserId(userId: string): Promise<IEnrollment[]> {
    return this.model.find({ userId }).exec();
  }

  async findByCourseId(courseId: string): Promise<IEnrollment[]> {
    return this.model.find({ courseId }).exec();
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<IEnrollment | null> {
    return this.model.findOne({ userId, courseId }).exec();
  }

  async findByUserAndCourseWithPopulate(
    userId: string,
    courseId: string,
    populateOptions: PopulateOptions[],
  ): Promise<IEnrollment | null> {
    let query = this.model.findOne({ userId, courseId });
    populateOptions.forEach((option) => {
      query = query.populate(option);
    });
    return query.exec();
  }

  async createMany(
    enrollments: Partial<IEnrollment>[],
  ): Promise<IEnrollment[]> {
    enrollments.forEach((enrollment) => {
      if (!enrollment.userId || !enrollment.courseId) {
        throw new Error("userId and courseId are required for all enrollments");
      }
    });
    const docs = await this.model.insertMany(enrollments, { ordered: true });
    return docs as IEnrollment[];
  }

  async createManyWithSession(
    enrollments: Partial<IEnrollment>[],
    session: mongoose.ClientSession,
  ): Promise<IEnrollment[]> {
    enrollments.forEach((enrollment) => {
      if (!enrollment.userId || !enrollment.courseId) {
        throw new Error("userId and courseId are required for all enrollments");
      }
    });
    const docs = await this.model.insertMany(enrollments, {
      session,
      ordered: true,
    });
    return docs as IEnrollment[];
  }

  async findByUserAndCoursesWithSession(
    userId: Types.ObjectId,
    courseIds: Types.ObjectId[],
    session: mongoose.ClientSession,
  ): Promise<IEnrollment[]> {
    return this.model
      .find({ userId, courseId: { $in: courseIds } })
      .session(session)
      .exec();
  }

  async updateEnrollmentWithSession(
    enrollmentId: Types.ObjectId,
    updates: Partial<IEnrollment>,
    session: mongoose.ClientSession,
  ): Promise<IEnrollment | null> {
    return this.model
      .findByIdAndUpdate(enrollmentId, updates, { new: true })
      .session(session)
      .exec();
  }

  async countByCourseId(courseId: string): Promise<number> {
    return await this.countDocuments({
      courseId: new Types.ObjectId(courseId),
    });
  }

  async isCourseEnrolledByStudent(courseId: string, studentId: string): Promise<boolean> {
  const enrollment = await this.findOne({
    courseId : new Types.ObjectId(courseId),
    userId : new Types.ObjectId(studentId), 
  });
  return !!enrollment;
}

}
