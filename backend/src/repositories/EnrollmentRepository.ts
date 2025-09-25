import { IEnrollment, EnrollmentModel } from "../models/enrollmentModel";
import { IEnrollmentRepository } from "./interfaces/IEnrollmentRepository";
import { GenericRepository } from "./genericRepository";

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
}
